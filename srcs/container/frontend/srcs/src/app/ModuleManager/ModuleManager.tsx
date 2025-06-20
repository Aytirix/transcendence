import React, { useState } from 'react';
import {
	DndContext,
	DragOverlay,
	useDraggable,
	useDroppable,
	closestCenter,
	DragEndEvent,
	DragStartEvent
} from '@dnd-kit/core';
import './assets/styles/ModuleManager.scss';
import modulesDataImport from './assets/ListeModules.json';

interface ModuleItem {
	id: string;
	title: string;
	description: string;
	major: boolean;
}

const modulesData: ModuleColumns = {
	untouched: [],
	rejected: [],
	undecided: [],
	accepted: []
};

// Charger les données du JSON et les traiter
if (typeof modulesDataImport === 'object' && modulesDataImport !== null) {
	// Vérifier si c'est déjà une structure avec colonnes
	if ('untouched' in modulesDataImport && Array.isArray((modulesDataImport as any).untouched)) {
		// Structure avec colonnes
		(Object.keys(modulesData) as ColumnKey[]).forEach(col => {
			if (col in modulesDataImport && Array.isArray((modulesDataImport as any)[col])) {
				modulesData[col] = (modulesDataImport as any)[col].map((item: any) => ({
					...item,
					major: typeof item.major === 'string'
						? item.major.toLowerCase() === 'majeur'
						: Boolean(item.major)
				}));
			}
		});
	} else if (Array.isArray(modulesDataImport)) {
		// Structure simple avec array
		modulesData.untouched = modulesDataImport.map((item: any) => ({
			...item,
			major: typeof item.major === 'string'
				? item.major.toLowerCase() === 'majeur'
				: Boolean(item.major)
		}));
	}
}

type ColumnKey = 'untouched' | 'rejected' | 'undecided' | 'accepted';
type ModuleColumns = Record<ColumnKey, ModuleItem[]>;

enum SubKey {
	major = 'majeur',
	minor = 'mineur'
}

const DroppableArea: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
	const { isOver, setNodeRef } = useDroppable({ id });
	return (
		<div ref={setNodeRef} className={`droppable-area ${isOver ? 'over' : ''}`}>
			{children}
		</div>
	);
};

const DraggableItem: React.FC<ModuleItem & { onContextMenu: (id: string) => void }> = ({
	id,
	title,
	onContextMenu
}) => {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
	const style: React.CSSProperties = {
		...(transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : {}),
		position: 'relative'
	};
	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			onContextMenu={e => {
				e.preventDefault();
				onContextMenu(id);
			}}
			className="module-item"
		>
			{title}
		</div>
	);
};

const Modal: React.FC<{ item: ModuleItem; onClose: () => void }> = ({ item, onClose }) => {
	const [isClosing, setIsClosing] = useState(false);

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(onClose, 300); // Attendre la fin de l'animation avant de fermer
	};

	return (
		<>
			<div
				className={`modal-backdrop ${isClosing ? 'fade-out' : 'fade-in'}`}
				onClick={handleClose}
			/>
			<div className={`modal-content-center ${isClosing ? 'slide-out' : 'slide-in'}`}>
				<h2>{item.title}</h2>
				<pre>{item.description}</pre>
				<button onClick={handleClose}>Fermer</button>
			</div>
		</>
	);
};

const DragAndDropModules: React.FC = () => {
	const [columns, setColumns] = useState<ModuleColumns>(() => {
		return { ...modulesData };
	});

	const [activeId, setActiveId] = useState<string | null>(null);
	const [modalItem, setModalItem] = useState<ModuleItem | null>(null);

	const handleDragStart = ({ active }: DragStartEvent) => {
		setActiveId(String(active.id));
	};

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		setActiveId(null);
		if (!over) return;
		const draggedId = String(active.id);
		const [toCol] = String(over.id).split(':') as [ColumnKey, SubKey];

		let sourceCol: ColumnKey | null = null;
		for (const col of Object.keys(columns) as ColumnKey[]) {
			if (columns[col].some(item => item.id === draggedId)) {
				sourceCol = col;
				break;
			}
		}

		if (sourceCol === toCol) return;

		let moved: ModuleItem | undefined;
		const colsSans = (Object.keys(columns) as ColumnKey[]).reduce((acc, col) => {
			const filtered = columns[col].filter(item => {
				if (item.id === draggedId) {
					moved = item;
					return false;
				}
				return true;
			});
			acc[col] = filtered;
			return acc;
		}, {} as ModuleColumns);

		if (!moved) return;
		if (colsSans[toCol].some(i => i.id === moved!.id)) return;

		const dest = colsSans[toCol];
		const majorList = dest.filter(i => i.major);
		const minorList = dest.filter(i => !i.major);

		if (moved.major) majorList.unshift(moved);
		else minorList.unshift(moved);

		setColumns({ ...colsSans, [toCol]: [...majorList, ...minorList] });
	};

	const splitSubColumns = (list: ModuleItem[]) => ({
		major: list.filter(i => i.major),
		minor: list.filter(i => !i.major)
	});

	const activeItem = activeId
		? Object.values(columns).flat().find(i => i.id === activeId)
		: null;

	const handleContextMenu = (id: string) =>
		setModalItem(Object.values(columns).flat().find(i => i.id === id) || null);


	const allModules = Object.values(columns).flat();
	const totalMinor = allModules.filter(m => !m.major).length;
	const totalMajor = allModules.filter(m => m.major).length;

	const acceptedModules = columns.accepted;
	const acceptedMajor = acceptedModules.filter(m => m.major).length;
	const acceptedMinor = acceptedModules.filter(m => !m.major).length;

	const points = 30 + acceptedMajor * 10 + acceptedMinor * 5;
	const percentage = Math.round((points / 100) * 100);

	const getColorByPercentage = (p: number) => {
		if (p >= 140) return '#38bdf8'; // bleu clair
		if (p >= 125) return '#15803d'; // vert foncé
		if (p >= 100) return '#22c55e'; // vert clair
		return '#dc2626'; // rouge
	};

	return (
		<DndContext
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="module-manager">
				<div
					className="stats"
					style={{
						backgroundColor: getColorByPercentage(percentage),
						color: '#fff',
						textAlign: 'center',
						borderRadius: '0.5rem',
						padding: '1rem',
						fontWeight: 'bold',
						marginBottom: '1rem'
					}}
				>
					<div>Mineur : {acceptedMinor} / {totalMinor}</div>
					<div>Majeur : {acceptedMajor} / {totalMajor}</div>
					<div>Total de points : {points} / 100</div>
				</div>


				{modalItem && <Modal item={modalItem} onClose={() => setModalItem(null)} />}

				<div className="lists">
					{(Object.keys(columns) as ColumnKey[]).map(col => {
						const subs = splitSubColumns(columns[col]);
						return (
							<div key={col} className="list-box">
								<h3>{col.toUpperCase()}</h3>
								<div className="sublists">
									{subs.minor.length > 0 && (
										<DroppableArea id={`${col}:${SubKey.minor}`}>
											<div className="sublist minor">
												<h3>Mineurs</h3>
												{subs.minor.map(item => (
													<DraggableItem
														key={item.id}
														{...item}
														onContextMenu={handleContextMenu}
													/>
												))}
											</div>
										</DroppableArea>
									)}

									{subs.major.length > 0 && (
										<DroppableArea id={`${col}:${SubKey.major}`}>
											<div className="sublist major">
												<h3>Majeurs</h3>
												{subs.major.map(item => (
													<DraggableItem
														key={item.id}
														{...item}
														onContextMenu={handleContextMenu}
													/>
												))}
											</div>
										</DroppableArea>
									)}

									{subs.minor.length === 0 && subs.major.length === 0 && (
										<DroppableArea id={`${col}:empty`}>
											<div className="sublist empty">
											</div>
										</DroppableArea>
									)}

								</div>
							</div>
						);
					})}
				</div>

				<DragOverlay>
					{activeItem && (
						<div className="module-item dragging-overlay">
							{activeItem.title}
						</div>
					)}
				</DragOverlay>
			</div>
		</DndContext>
	);
};

export default DragAndDropModules;
