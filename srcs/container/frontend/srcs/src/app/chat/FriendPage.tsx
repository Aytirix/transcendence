// src/FriendsSearchPage.tsx

import React from "react";
import { useChatWebSocket } from "./ChatWebSocketContext";
import ApiService from "../../api/ApiService";

const FriendPage: React.FC = () => {
	const {
		friends,
		inputSearch,
		setInputSearch,
		searchResults,
		handleAddFriend,
		handleAcceptFriend,
		handleRefuseFriend,
		handleCancelFriend,
		handleRemoveFriend,
		handleBlockedFriend,
		handleUnBlockedFriend,
	} = useChatWebSocket();

	// Filtrer les amis selon le terme de recherche

	const filteredFriends = inputSearch.length > 0 ? (searchResults ?? []) : friends;

	// const filteredFriends = friends.filter(friend =>
	// 	friend.username.toLowerCase().includes(inputSearch.toLowerCase())
	// );

	async function testInvitePong(friendId: number) {
		const response = await ApiService.post(`/pong/invitePlayer`, { friendId });
		return response;
	}

	function RelationPending({ friend, handleAcceptFriend, handleRefuseFriend, handleCancelFriend }: any) {
		return (
			<div className="flex gap-2">
				<button
					title="Bloquer l'utilisateur"
					className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
					onClick={() => handleBlockedFriend(friend.id)}
				>
					<img src="/images/block.png" alt="Bloquer" className="w-7 h-7" />
				</button>
				{friend.relation.target !== friend.id ? (
					<>
						<button
							title="Accepter la demande d'ami"
							className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
							onClick={() => handleAcceptFriend(friend.id)}
						>
							<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</button>
						<button
							title="Refuser la demande d'ami"
							className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
							onClick={() => handleRefuseFriend(friend.id)}
						>
							<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</>
				) : (
					<button
						className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
						onClick={() => handleCancelFriend(friend.id)}
						title="Annuler la demande d'ami"
					>
						<img src="/images/croix.png" alt="Annuler" className="w-7 h-7" />
					</button>
				)}
			</div>
		);
	}

	function RelationBlocked({ friend, handleUnBlockedFriend }: any) {
		return (
			<div className="flex gap-2">
				<button
					title="Débloquer l'utilisateur"
					className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
					onClick={() => handleUnBlockedFriend(friend.id)}
				>
					<img src="/images/unblock.png" alt="Débloquer" className="w-7 h-7" />
				</button>
			</div>
		);
	}

	function RelationFriend({ friend, handleBlockedFriend, handleRemoveFriend }: any) {
		return (
			<div className="flex gap-2">
				<button
					title="Bloquer l'ami"
					className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
					onClick={() => handleBlockedFriend(friend.id)}
				>
					<img src="/images/block.png" alt="Bloquer" className="w-7 h-7" />
				</button>
				<button
					title="Supprimer l'ami"
					className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
					onClick={() => handleRemoveFriend(friend.id)}
				>
					<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				<button
					title="Inviter à jouer à Pong"
					className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
					onClick={() => testInvitePong(friend.id)}
				>
					<img src="/images/intro/floating-pong.png" alt="Pong" className="w-7 h-7" />
				</button>
			</div>
		);
	}

	function RelationNone({ friend, handleBlockedFriend, handleAddFriend }: any) {
		return (
			<div className="flex gap-2">
				<button
					title="Bloquer l'utilisateur"
					className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
					onClick={() => handleBlockedFriend(friend.id)}
				>
					<img src="/images/block.png" alt="Bloquer" className="w-7 h-7" />
				</button>
				<button
					title="Ajouter en ami"
					className="!bg-[#ffffff00] hover:scale-110 !border-none !p-1"
					onClick={() => handleAddFriend(friend.id)}
				>
					<img src="/images/addFriend.png" alt="Ajouter" className="w-7 h-7" />
				</button>
			</div>
		);
	}

	return (
		<div className="h-screen flex items-center justify-center relative overflow-hidden p-4">
			<div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
				<div className="absolute left-50 top-30 animate-bounce-slow text-5xl opacity-30 select-none">👥</div>
				<div className="absolute right-40 top-50 animate-float text-4xl opacity-20 select-none">💬</div>
				<div className="absolute right-100 bottom-30 animate-bounce-slow text-5xl opacity-20 select-none">🎮</div>
				<div className="absolute left-1/4 bottom-1/4 animate-float text-3xl opacity-15 select-none">🤝</div>
			</div>

			<div className="z-10 w-full max-w-4xl h-full max-h-[calc(100vh-9rem)] mt-16">
				<fieldset className="bg-gray-900 bg-opacity-90 border border-gray-700 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 h-full">
					<legend className="text-2xl font-bold text-center text-white tracking-widest gradient-text">Liste des amis</legend>
					{/* Input de recherche */}
					<div className="mb-2 flex justify-center">
						<input
							type="text"
							placeholder="Rechercher un utilisateur..."
							value={inputSearch}
							maxLength={10}
							onChange={(e) => setInputSearch(e.target.value)}
							className="w-80 px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 text-center"
						/>
					</div>

					{filteredFriends.length === 0 && inputSearch ? (
						<div className="text-center text-gray-400 py-8 flex-1 flex items-center justify-center">
							Aucun ami trouvé pour "{inputSearch}"
						</div>
					) : filteredFriends.length === 0 && friends.length === 0 ? (
						<div className="text-center text-gray-400 py-8 flex-1 flex items-center justify-center">
							Aucun ami pour le moment
						</div>
					) : (
						<div className="flex-1 overflow-y-auto">
							<ul className="space-y-3">
								{filteredFriends.map((friend) => (
									<li className="bg-gray-800 bg-opacity-50 border border-gray-600 rounded-xl p-4 hover:bg-gray-700 hover:bg-opacity-50 transition-all duration-300" key={friend.id}>
										<div className="flex gap-4">
											{/* Avatar */}
											<div className={`avatar ${friend.online ? "avatar-online" : "avatar-offline"}`}>
												<div className="w-16 h-16 rounded-full ring-2 ring-gray-600 hover:ring-yellow-400 transition-all duration-300">
													<img src={ApiService.getFile(friend.avatar)} alt="Avatar" className="w-full h-full rounded-full object-cover" />
												</div>
											</div>

											{/* Contenu principal */}
											<div className="flex-1">
												{/* Pseudo en haut */}
												<div className="text-white font-semibold text-lg mb-2 text-left">{friend.username}</div>

												{/* Drapeau + Status à gauche, Boutons à droite */}
												<div className="flex justify-between items-center">
													{/* Drapeau et status à gauche */}
													<div className="flex items-center gap-2">
														<div className="w-7 h-7 rounded-full overflow-hidden">
															<img src={`/flags/${friend.lang}_flat.png`} alt="Flag" className="w-full h-full object-cover" />
														</div>
														<div className={`text-sm font-medium ${friend.relation.status === "friend"
															? "text-green-400"
															: friend.relation.status === "pending"
																? "text-yellow-400"
																: friend.relation.status === "blocked"
																	? "text-red-400"
																	: "text-gray-400"
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

													{/* Boutons à droite */}
													<div className="flex-shrink-0">
														{friend.relation.status === "pending" ? (
															<RelationPending friend={friend} handleAcceptFriend={handleAcceptFriend} handleRefuseFriend={handleRefuseFriend} handleCancelFriend={handleCancelFriend} />
														) : friend.relation.status === "blocked" ? (
															<RelationBlocked friend={friend} handleUnBlockedFriend={handleUnBlockedFriend} />
														) : friend.relation.status === "friend" ? (
															<RelationFriend friend={friend} handleBlockedFriend={handleBlockedFriend} handleRemoveFriend={handleRemoveFriend} />
														) : (
															<RelationNone friend={friend} handleBlockedFriend={handleBlockedFriend} handleAddFriend={handleAddFriend} />
														)}
													</div>
												</div>
											</div>
										</div>
									</li>))}
							</ul>
						</div>
					)}
				</fieldset>
			</div>
		</div>
	);
};

export default FriendPage;
