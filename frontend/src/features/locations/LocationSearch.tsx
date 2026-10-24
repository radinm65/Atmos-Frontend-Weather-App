import { Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { describeLocationDetail } from '../../domain/location'
import type { Location } from '../../domain/location'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { describeError } from '../../lib/api'
import { useWeatherDataSource } from '../weather/WeatherDataSourceContext'
import styles from './LocationSearch.module.css'
import { MIN_SEARCH_LENGTH, useLocationSearch } from './useLocationSearch'

const DEBOUNCE_MS = 300

export interface LocationSearchProps {
  onSelect: (location: Location) => void
  /** Move focus to the input when mounted. Use only when the search was just opened on purpose. */
  focusOnMount?: boolean
}

/** Accessible combobox: type to search, arrow keys to move, Enter to choose, Escape to clear. */
export function LocationSearch({ onSelect, focusOnMount = false }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus()
  }, [focusOnMount])

  const baseId = useId()
  const inputId = `${baseId}-input`
  const listboxId = `${baseId}-listbox`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const source = useWeatherDataSource()
  const [text, setText] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounced = useDebouncedValue(text, DEBOUNCE_MS)
  const search = useLocationSearch(debounced)

  const term = text.trim()
  const searchedTerm = debounced.trim()
  const isCurrent = term === searchedTerm
  const canSearch = term.length >= MIN_SEARCH_LENGTH
  const results: Location[] = isCurrent && canSearch ? (search.data ?? []) : []
  const showList = results.length > 0

  function choose(location: Location) {
    setText('')
    setActiveIndex(-1)
    onSelect(location)
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value)
    setActiveIndex(-1)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        if (!showList) return
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % results.length)
        break
      case 'ArrowUp':
        if (!showList) return
        event.preventDefault()
        setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1))
        break
      case 'Enter': {
        const chosen = results[activeIndex]
        if (chosen) {
          event.preventDefault()
          choose(chosen)
        }
        break
      }
      case 'Escape':
        if (text) {
          // Clear the text first; a second Escape lets a surrounding popover close.
          event.stopPropagation()
          setText('')
          setActiveIndex(-1)
        }
        break
    }
  }

  let status: ReactNode = null
  if (text.length > 0 && !canSearch) {
    status = `Keep typing: enter at least ${MIN_SEARCH_LENGTH} letters.`
  } else if (canSearch && (!isCurrent || search.isFetching)) {
    status = 'Searching…'
  } else if (canSearch && search.isError) {
    const { title, message } = describeError(search.error)
    status = (
      <>
        <span>
          {title}. {message}
        </span>{' '}
        <Button variant="ghost" onClick={() => void search.refetch()}>
          Try again
        </Button>
      </>
    )
  } else if (canSearch && search.isSuccess && results.length === 0) {
    status =
      source.kind === 'snapshot'
        ? `No recorded places match "${term}". Only places with recorded data can be found.`
        : `No places found for "${term}". Check the spelling or try a nearby city.`
  } else if (showList) {
    status = `${results.length} ${results.length === 1 ? 'place' : 'places'} found. Use the arrow keys to choose.`
  }

  return (
    <div className={styles.search}>
      <label htmlFor={inputId} className={styles.label}>
        Search for a city
      </label>
      <div className={styles.field}>
        <Search size={18} aria-hidden="true" className={styles.icon} />
        <input
          id={inputId}
          className={styles.input}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. Berlin"
          value={text}
          ref={inputRef}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      </div>

      <ul
        id={listboxId}
        role="listbox"
        aria-label="Matching places"
        className={styles.list}
        hidden={!showList}
      >
        {results.map((location, index) => (
          // Keyboard access is provided by the combobox input (arrow keys + Enter), per the ARIA
          // combobox pattern, so options themselves are intentionally not focusable.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
          <li
            key={location.id}
            id={optionId(index)}
            role="option"
            aria-selected={index === activeIndex}
            className={`${styles.option} ${index === activeIndex ? styles.optionActive : ''}`}
            // Keep focus in the input so keyboard users stay in the combobox.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(location)}
            onMouseMove={() => setActiveIndex(index)}
          >
            <span className={styles.optionName}>{location.name}</span>
            <span className={styles.optionDetail}>{describeLocationDetail(location)}</span>
          </li>
        ))}
      </ul>

      <div role="status" aria-live="polite" className={styles.status}>
        {status}
      </div>
    </div>
  )
}
