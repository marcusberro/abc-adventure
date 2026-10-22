export default function LanguagePicker({ languages, current, onChange }) {
  return (
    <div className="langs">
      {Object.entries(languages).map(([key, l]) => (
        <button key={key} className="lang" aria-pressed={key === current} onClick={() => onChange(key)}>
          {l.flag} {l.name}
        </button>
      ))}
    </div>
  )
}
