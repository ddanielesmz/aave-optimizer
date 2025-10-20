const ChartPlaceholder = ({ height = "h-48" }) => {
  return (
    <div className={`flex w-full items-center justify-center ${height}`}>
      <span
        className="loading loading-spinner text-primary"
        aria-label="Loading chart"
      />
    </div>
  );
};

export default ChartPlaceholder;
