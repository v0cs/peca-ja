const ReadOnlyField = ({ label, value, helperText }) => {
  const displayValue =
    value !== undefined && value !== null && value !== ""
      ? value
      : "—";

  return (
    <div className="flex flex-col rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </span>
      )}
      <span className="mt-1 text-base font-medium text-gray-900">
        {displayValue}
      </span>
      {helperText && (
        <span className="mt-1 text-xs text-gray-500">{helperText}</span>
      )}
    </div>
  );
};

export default ReadOnlyField;




