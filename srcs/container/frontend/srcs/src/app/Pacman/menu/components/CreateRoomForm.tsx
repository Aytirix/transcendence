import React from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

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
	const { t } = useLanguage();
	return (
		<div className="create-room">
			<input
				type="text"
				placeholder={t("pacman.menu.lobby.gameNamePlaceholder")}
				value={roomName}
				onChange={onRoomNameChange}
				onKeyDown={onKeyDown}
				maxLength={maxLength}
			/>
			<button onClick={onCreateRoom}>{t("pacman.menu.lobby.create")}</button>
		</div>
	);
};

export default CreateRoomForm;
