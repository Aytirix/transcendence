import React from 'react';
import { Friend } from '../types/chat'; // Assurez-vous que le chemin est correct
import ApiService from '../../../api/ApiService';

interface FriendListProps {
	friends: Friend[];
	handleAddFriend: (userId: number) => void;
	currentUserId: number;
	handleAcceptFriend: (userId: number) => void;
	handleRefuseFriend: (userId: number) => void;
	handleCancelFriend: (userId: number) => void;
	handleRemoveFriend: (userId: number) => void;
	handleBlockedFriend: (userId: number) => void;
	handleUnBlockedFriend: (userId: number) => void;
}

const FriendList: React.FC<FriendListProps> = ({
	friends,
	handleAddFriend,
	currentUserId,
	handleAcceptFriend,
	handleRefuseFriend,
	handleCancelFriend,
	handleRemoveFriend,
	handleBlockedFriend,
	handleUnBlockedFriend
}) => {
	if (friends.length === 0) {
		return (
			<div className="text-center text-gray-500 mt-8">
				Aucun ami pour le moment
			</div>
		);
	}

	async function testInvitePong(friendId: number) {
		const response = await ApiService.post(`/pong/invitePlayer`, { friendId });
		return response;
	}

	function RelationPending({ friend, handleAcceptFriend, handleRefuseFriend, handleCancelFriend }: any) {
		return (
			<div>
				<button
					title="Bloquer l'utilisateur"
					className="px-1 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
					onClick={() => handleBlockedFriend(friend.id)}
				>
					<img src="/images/block.png" alt="Bloquer" className="w-6 h-6" />
				</button>
				{friend.relation.target !== friend.id ? (
					<>
						<button
							title="Accepter la demande d'ami"
							className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium mx-2"
							onClick={() => handleAcceptFriend(friend.id)}
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</button>
						<button
							title="Refuser la demande d'ami"
							className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
							onClick={() => handleRefuseFriend(friend.id)}
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</>
				) : (
					<button
						className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium mx-2"
						onClick={() => handleCancelFriend(friend.id)}
						title="Annuler la demande d'ami"
					>
						<img src="/images/croix.png" alt="Annuler" className="w-6 h-6" />
					</button>
				)}
			</div>
		);
	}

	function RelationBlocked({ friend, handleUnBlockedFriend, handleRemoveFriend }: any) {
		return (
			<div>
				<button
					title="Débloquer l'utilisateur"
					className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
					onClick={() => handleUnBlockedFriend(friend.id)}
				>
					<img src="/images/unblock.png" alt="Débloquer" className="w-6 h-6" />
				</button>
				<span> </span>
			</div>
		);
	}

	function RelationFriend({ friend, handleBlockedFriend, handleRemoveFriend }: any) {
		return (
			<div>
				<button
					title="Bloquer l'ami"
					className="px-1 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
					onClick={() => handleBlockedFriend(friend.id)}
				>
					<img src="/images/block.png" alt="Bloquer" className="w-6 h-6" />
				</button>
				<span> </span>
				<button
					title="Supprimer l'ami"
					className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
					onClick={() => handleRemoveFriend(friend.id)}
				>
					<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				<button
					title="Inviter à jouer à Pong"
					className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
					onClick={() => testInvitePong(friend.id)}
				>
					<img src="/images/intro/floating-pong.png" alt="Pong" className="w-6 h-6" />
				</button>
			</div>
		);
	}

	function RelationNone({ friend, handleBlockedFriend, handleAddFriend }: any) {
		return (
			<div>
				<button
					title="Bloquer l'utilisateur"
					className="px-1 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
					onClick={() => handleBlockedFriend(friend.id)}
				>
					<img src="/images/block.png" alt="Bloquer" className="w-6 h-6" />
				</button>
				<span> </span>
				<button
					title="Ajouter en ami"
					className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
					onClick={() => handleAddFriend(friend.id)}
				>
					<img src="/images/addFriend.png" alt="Ajouter" className="w-6 h-6" />
				</button>
			</div>
		);
	}

	return (
		<ul className="list bg-base-100 rounded-box shadow-md">
			{friends.map((friend) => (
				<li className="list-row flex justify-between w-full items-center" key={friend.id}>
					{/* {console.log("friend.id",friend.id, friend.username)} */}
					<div className="flex gap-4 items-center">
						<div className={`avatar ${friend.online ? "avatar-online" : "avatar-offline"}`}>
							<div className="w-18 rounded-full"><img src={ApiService.getFile(friend.avatar)} alt="A" /></div></div>
						<div className="w-40 text-left">{friend.username}</div>
						<div className="w-6 rounded-full"><img src={`/flags/${friend.lang}_flat.png`} alt="A" /></div>
						<div className={`${friend.relation.status === "friend"
							? "text-green-700"
							: friend.relation.status === "pending"
								? "text-yellow-600"
								: friend.relation.status === "blocked"
									? "text-red-700"
									: "text-gray-500"
							}`}>
							{friend.relation.status === "pending"
								? "En attente"
								: friend.relation.status === "blocked"
									? "Bloqué"
									: friend.relation.status === "friend"
										? "Ami"
										: ""
							}
						</div>
					</div>
					{friend.relation.status === "pending" ? (
						<RelationPending friend={friend} handleAcceptFriend={handleAcceptFriend} handleRefuseFriend={handleRefuseFriend} handleCancelFriend={handleCancelFriend} />
					) : friend.relation.status === "blocked" ? (
						<RelationBlocked friend={friend} handleUnBlockedFriend={handleUnBlockedFriend} handleRemoveFriend={handleRemoveFriend} />
					) : friend.relation.status === "friend" ? (
						<RelationFriend friend={friend} handleBlockedFriend={handleBlockedFriend} handleRemoveFriend={handleRemoveFriend} />
					) : (
						<RelationNone friend={friend} handleBlockedFriend={handleBlockedFriend} handleAddFriend={handleAddFriend} />
					)}
				</li>
			))}
		</ul>
	);
};

export default FriendList;
