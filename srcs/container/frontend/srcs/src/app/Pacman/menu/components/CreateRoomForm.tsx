import React from 'react';

interface CreateRoomFormProps {
	roomName: string;
	onRoomNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	onCreateRoom: () => void;
	maxLength: number;
}

const CreateRoomForm: React.FC<CreateRoomFormProps> = ({
	roomName,
	onRoomNameChange,
	onKeyDown,
	onCreateRoom,
	maxLength
}) => {
	return (
		<div className="create-room">
			<input
				type="text"
				placeholder="Nom de la salle"
				value={roomName}
				onChange={onRoomNameChange}
				onKeyDown={onKeyDown}
				maxLength={maxLength}
			/>
			<button onClick={onCreateRoom}>Créer une salle</button>
		</div>
	);
};

export default CreateRoomForm;
