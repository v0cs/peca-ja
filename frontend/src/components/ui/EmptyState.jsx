const EmptyState = ({ 
  title, 
  message, 
  actionLabel, 
  onAction, 
  icon 
}) => {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{message}</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;


