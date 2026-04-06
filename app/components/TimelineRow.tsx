import { GRID_COLS_STYLE } from '@/lib/constants'

export type TimelineCell = { color: string; title: string }

/**
 * A single row of 24 hour-cells. The clip boundary (overflow-hidden + rounded)
 * lives on a wrapper <div> rather than on the CSS-grid element itself. This
 * prevents a Chrome/Safari compositing bug where `overflow:hidden` on a grid
 * with fractional-px column widths can collapse cell backgrounds to 0 height.
 */
export function TimelineRow({ cells }: { cells: TimelineCell[] }) {
  return (
    <div className="flex-1 overflow-hidden rounded" role="row">
      <div className="grid" style={GRID_COLS_STYLE}>
        {cells.map((c, i) => (
          <div
            key={i}
            role="cell"
            aria-label={c.title}
            className={`h-6 ${c.color}`}
            title={c.title}
          />
        ))}
      </div>
    </div>
  )
}
