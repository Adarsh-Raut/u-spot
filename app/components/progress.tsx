export default function ConversionProgress({ progress }: { progress: number }) {
  return (
    <div className="card w-96 bg-base-100 shadow-xl mt-4">
      <div className="card-body">
        <h2 className="card-title">Conversion Progress</h2>
        <progress
          className="progress progress-primary w-full"
          value={progress}
          max="100"
        ></progress>
        <p className="text-center mt-2">{progress}% Complete</p>
      </div>
    </div>
  );
}
