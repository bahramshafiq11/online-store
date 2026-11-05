export default function Rating({ value = 0, text }) {
  const rounded = Math.round(value);

  return (
    <span className="rating">
      <span className="stars" aria-label={`${value.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? "star on" : "star"}>★</span>
        ))}
      </span>
      {text && <span className="rating-text">{text}</span>}
    </span>
  );
}