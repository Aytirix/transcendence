import React, { useState, useEffect } from 'react';
import ApiService from '../../api/ApiService';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserProfileModalProps {
  userId: number;
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserStats {
  // Pong stats
  pongStats: {
    total: {
      victoire: number;
      defaite: number;
      abandon: number;
      nbParti: number;
      victoirePour100: number;
      defaitePour100: number;
      abandonPour100: number;
    };
    tournamentVictory: number;
    Multi: {
      victoire: number;
      defaite: number;
      abandon: number;
      nbParti: number;
      victoirePour100: number;
      defaitePour100: number;
      abandonPour100: number;
    };
    Tournament: {
      victoire: number;
      defaite: number;
      abandon: number;
      nbParti: number;
      victoirePour100: number;
      defaitePour100: number;
      abandonPour100: number;
    };
    Solo: {
      victoire: number;
      defaite: number;
      abandon: number;
      nbParti: number;
      victoirePour100: number;
      defaitePour100: number;
      abandonPour100: number;
    };
    SameKeyboard: {
      nbParti: number;
    };
    lastFive: Array<{
      status: 'Victoire' | 'Défaite' | 'Abandon';
      opponentName: string;
      mode: string;
      date: string;
    }>;
  };
  // Pacman stats
  pacmanStats: {
    pacman: {
      games_played: number;
      games_won: number;
      games_lost: number;
      win_rate: number;
      best_score: number;
      average_score: number;
    };
    ghosts: {
      games_played: number;
      games_won: number;
      games_lost: number;
      win_rate: number;
      best_score: number;
      average_score: number;
    };
    record_pacman: Array<{
      id: number;
      username: string;
      score: number;
    }>;
    record_ghost: Array<{
      id: number;
      username: string;
      score: number;
    }>;
  };
  // User profile info
  profile: {
    id: number;
    username: string;
    avatar: string;
    lang: string;
  };
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, username, isOpen, onClose }) => {
  const { t } = useLanguage();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'pong' | 'pacman'>('profile');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserStats();
    }
  }, [isOpen, userId]);

  const fetchUserStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user profile
      const profileResponse = await ApiService.get(`/user/${userId}`);
      
      // Fetch Pong statistics
      const pongResponse = await ApiService.get(`/pong/statistics/${userId}`);
      
      // Fetch Pacman statistics  
      const pacmanResponse = await ApiService.get(`/pacman/statistics/${userId}`);

      if (profileResponse.success && pongResponse.success && pacmanResponse.success) {
        setUserStats({
          profile: profileResponse.user,
          pongStats: pongResponse.stats,
          pacmanStats: pacmanResponse.stats
        });
      } else {
        setError(t('profile.modal.errorLoading'));
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(t('profile.modal.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="user-profile-modal-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="user-profile-modal__header">
          <h2 className="user-profile-modal__title">
            {t('profile.modal.title', { username })}
          </h2>
          <button 
            className="user-profile-modal__close" 
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="user-profile-modal__loading">
            <div className="loading-spinner"></div>
            <p>{t('profile.modal.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="user-profile-modal__error">
            <p>{error}</p>
            <button onClick={fetchUserStats} className="retry-button">
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Content */}
        {userStats && !loading && (
          <>
            {/* Tab Navigation */}
            <div className="user-profile-modal__tabs">
              <button
                className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                {t('profile.modal.tabs.profile')}
              </button>
              <button
                className={`tab-button ${activeTab === 'pong' ? 'active' : ''}`}
                onClick={() => setActiveTab('pong')}
              >
                {t('profile.modal.tabs.pong')}
              </button>
              <button
                className={`tab-button ${activeTab === 'pacman' ? 'active' : ''}`}
                onClick={() => setActiveTab('pacman')}
              >
                {t('profile.modal.tabs.pacman')}
              </button>
            </div>

            {/* Tab Content */}
            <div className="user-profile-modal__content">
              {activeTab === 'profile' && (
                <div className="profile-tab">
                  <div className="profile-info">
                    <div className="profile-avatar">
                      <img 
                        src={ApiService.getFile(userStats.profile.avatar)} 
                        alt={userStats.profile.username}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ApiService.getFile(null);
                        }}
                      />
                    </div>
                    <div className="profile-details">
                      <h3>{userStats.profile.username}</h3>
                      <div className="profile-language">
                        <img 
                          src={`/flags/${userStats.profile.lang}_flat.png`} 
                          alt={userStats.profile.lang}
                          className="language-flag"
                        />
                        <span>{userStats.profile.lang.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pong' && (
                <div className="pong-tab">
                  <div className="stats-summary">
                    <div className="stat-card">
                      <h4>{t('profile.modal.pong.wins')}</h4>
                      <span className="stat-value">{userStats.pongStats.total.victoire}</span>
                    </div>
                    <div className="stat-card">
                      <h4>{t('profile.modal.pong.losses')}</h4>
                      <span className="stat-value">{userStats.pongStats.total.defaite}</span>
                    </div>
                    <div className="stat-card">
                      <h4>{t('profile.modal.pong.abandons')}</h4>
                      <span className="stat-value">{userStats.pongStats.total.abandon}</span>
                    </div>
                    <div className="stat-card">
                      <h4>{t('profile.modal.pong.winRate')}</h4>
                      <span className="stat-value">
                        {Math.round(userStats.pongStats.total.victoirePour100)}%
                      </span>
                    </div>
                  </div>

                  <div className="match-history">
                    <h4>{t('profile.modal.pong.matchHistory')}</h4>
                    {userStats.pongStats.lastFive.length === 0 ? (
                      <p className="no-matches">{t('profile.modal.pong.noMatches')}</p>
                    ) : (
                      <div className="match-list">
                        {userStats.pongStats.lastFive.map((match, index) => (
                          <div key={index} className={`match-item ${match.status === 'Victoire' ? 'win' : 'loss'}`}>
                            <div className="match-result">
                              <span className={`match-status ${match.status === 'Victoire' ? 'win' : 'loss'}`}>
                                {match.status === 'Victoire' ? t('profile.modal.match.win') : 
                                 match.status === 'Défaite' ? t('profile.modal.match.loss') : 
                                 t('profile.modal.match.abandon')}
                              </span>
                              <span className="match-opponent">
                                {t('profile.modal.match.vs')} {match.opponentName}
                              </span>
                            </div>
                            <div className="match-details">
                              <span className="match-mode">
                                {match.mode}
                              </span>
                              <span className="match-date">{formatDate(match.date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'pacman' && (
                <div className="pacman-tab">
                  <div className="stats-summary">
                    <div className="stat-card">
                      <h4>{t('profile.modal.pacman.gamesAsPacman')}</h4>
                      <span className="stat-value">{userStats.pacmanStats.pacman.games_played}</span>
                    </div>
                    <div className="stat-card">
                      <h4>{t('profile.modal.pacman.gamesAsGhost')}</h4>
                      <span className="stat-value">{userStats.pacmanStats.ghosts.games_played}</span>
                    </div>
                    <div className="stat-card">
                      <h4>{t('profile.modal.pacman.bestScore')}</h4>
                      <span className="stat-value">{Math.max(userStats.pacmanStats.pacman.best_score, userStats.pacmanStats.ghosts.best_score)}</span>
                    </div>
                  </div>

                  <div className="match-history">
                    <h4>{t('profile.modal.pacman.matchHistory')}</h4>
                    <div className="pacman-records">
                      <div className="record-section">
                        <h5>{t('profile.modal.pacman.pacmanRecords')}</h5>
                        {userStats.pacmanStats.record_pacman.length === 0 ? (
                          <p className="no-matches">{t('profile.modal.pacman.noRecords')}</p>
                        ) : (
                          <div className="record-list">
                            {userStats.pacmanStats.record_pacman.map((record) => (
                              <div key={record.id} className="record-item">
                                <span className="record-username">{record.username}</span>
                                <span className="record-score">{record.score}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="record-section">
                        <h5>{t('profile.modal.pacman.ghostRecords')}</h5>
                        {userStats.pacmanStats.record_ghost.length === 0 ? (
                          <p className="no-matches">{t('profile.modal.pacman.noRecords')}</p>
                        ) : (
                          <div className="record-list">
                            {userStats.pacmanStats.record_ghost.map((record) => (
                              <div key={record.id} className="record-item">
                                <span className="record-username">{record.username}</span>
                                <span className="record-score">{record.score}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
