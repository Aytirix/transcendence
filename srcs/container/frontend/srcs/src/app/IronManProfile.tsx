import IronManNavBar from './IronManNavBar';
import './assets/styles/IronManProfile.css';

const IronManProfile = () => (
    <>
        <IronManNavBar />
        <div className="ironman-profile-card">
            <div className="im-profile-header">
                <div className="im-avatar">
                    <span>IM</span>
                </div>
                <h2 className="im-username">{}</h2>
            </div>
            <div className="im-profile-fields">
                <div>
                    <span className="im-label">Email :</span>
                    <span className="im-value">{}</span>
                </div>
                <div>
                    <span className="im-label">Langue :</span>
                    <span className="im-value">{}</span>
                </div>
                {/* On n'affiche évidemment PAS le password en vrai ! */}
                <div>
                    <span className="im-label">Mot de passe (hashé) :</span>
                    <span className="im-value">{}</span>
                </div>
            </div>
        </div>
    </>
);

export default IronManProfile;
