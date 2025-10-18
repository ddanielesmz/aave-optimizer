"use client";

const UpcomingWebinarCard = ({ data }) => {
  return (
    <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 border border-primary/20">
      <div className="card-body p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-base-content mb-2">
              {data?.title}
            </h3>
            <p className="text-sm text-base-content/70 mb-4">
              {data?.description}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center ml-4">
            <svg className="w-8 h-8 text-primary-content" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
              <svg className="w-4 h-4 text-base-content/60" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-base-content">
                {new Date(data?.date).toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-xs text-base-content/60">
                {data?.time} (CET)
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
              <svg className="w-4 h-4 text-base-content/60" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-base-content">
                {data?.attendees} partecipanti registrati
              </div>
              <div className="text-xs text-base-content/60">
                Posti limitati disponibili
              </div>
            </div>
          </div>
        </div>
        
        <button className="btn btn-primary btn-sm w-full gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Registrati al Webinar
        </button>
      </div>
    </div>
  );
};

export default UpcomingWebinarCard;
