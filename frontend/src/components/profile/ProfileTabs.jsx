const ProfileTabs = ({ tabs = [], activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-4" aria-label="Perfil">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ProfileTabs;




