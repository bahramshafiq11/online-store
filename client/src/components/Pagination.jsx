// Which page numbers to show, e.g. 1 ... 4 5 6 ... 12
const getPageNumbers = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const nums = [1, page - 1, page, page + 1, pages]
    .filter((n) => n >= 1 && n <= pages)
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .sort((a, b) => a - b);

  const result = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) result.push("...");
    result.push(n);
  });
  return result;
};

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pages">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}>
        ← Prev
      </button>

      {getPageNumbers(page, pages).map((n, i) =>
        n === "..." ? (
          <span key={`dots-${i}`} className="dots">…</span>
        ) : (
          <button
            key={n}
            className={n === page ? "active" : ""}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        )
      )}

      <button onClick={() => onChange(page + 1)} disabled={page === pages}>
        Next →
      </button>
    </nav>
  );
}