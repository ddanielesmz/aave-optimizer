"use client";

const ActiveProjectsCard = ({ projects }) => {
  return (
    <div className="card bg-base-100 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
      <div className="card-body p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content">Active Projects</h3>
          <div className="badge badge-primary badge-sm">4 Active</div>
        </div>
        
        <div className="space-y-4">
          {projects?.map((project, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-base-content/80">
                  {project.name}
                </span>
                <span className="text-sm font-semibold text-base-content">
                  {project.progress}%
                </span>
              </div>
              <div className="w-full bg-base-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${project.color} transition-all duration-500`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveProjectsCard;
