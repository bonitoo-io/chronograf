import React, {useState, PureComponent} from 'react'
import onClickOutside from 'react-onclickoutside'

import Dropdown from 'src/shared/components/Dropdown'
import {AGG_WINDOW_AUTO, DURATIONS} from './util/constants'

import {connect} from 'react-redux'
import {notify} from 'src/shared/actions/notifications'
import {fluxWizardError} from 'src/shared/copy/notifications'

function isDurationParseable(duration: string): boolean {
  const durationRegExp = /^(?:[1-9][0-9]*(?:y|mo|w|d|h|ms|s|m|us|µs|ns))+$/g
  return !!duration.match(durationRegExp)
}
interface Props {
  selected: string
  autoPeriod: string
  onChoose: (value: string) => void
}

const WindowPeriod = ({selected, autoPeriod, onChoose}: Props) => {
  const [customDuration, setCustomDuration] = useState(
    undefined as string | undefined
  )

  let items = DURATIONS
  const autoValue = `auto (${autoPeriod})`
  if (selected === AGG_WINDOW_AUTO) {
    selected = autoValue
  }
  if (!items.includes(selected) && selected !== autoValue) {
    const selectedText = `custom (${selected})`
    items = [
      ({text: selectedText, value: selected} as unknown) as string,
      ...items,
    ]
    selected = selectedText
  } else {
    items = [`custom`, ...items]
  }
  items = [autoValue, ...items]
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {customDuration !== undefined ? (
        <CustomDurationInput
          customDuration={customDuration}
          setCustomDuration={setCustomDuration}
          onChoose={onChoose}
        />
      ) : (
        <Dropdown
          items={items}
          onChoose={({text, value}) => {
            if (text.startsWith('custom')) {
              setCustomDuration(value ?? '')
              return
            }
            onChoose(text.startsWith(AGG_WINDOW_AUTO) ? AGG_WINDOW_AUTO : text)
          }}
          selected={selected}
          buttonSize="btn-sm"
          className="dropdown-stretch"
        />
      )}
    </div>
  )
}

interface CustomDurationProps {
  notify: (notification: any) => void
  customDuration: string
  setCustomDuration: (value: string | undefined) => void
  onChoose: (value: string) => void
}
class DurationInput extends PureComponent<CustomDurationProps> {
  public render() {
    const {customDuration, setCustomDuration, onChoose} = this.props
    const valid = isDurationParseable(customDuration)
    return (
      <input
        className="form-control input-sm"
        placeholder="Enter custom duration"
        type="text"
        style={valid ? undefined : {border: '2px solid #F95F53'}}
        value={customDuration}
        onChange={e => setCustomDuration(e.target.value)}
        onKeyUp={e => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            setCustomDuration(undefined)
          }
          if (e.key === 'Enter') {
            e.stopPropagation()
            if (valid) {
              setCustomDuration(undefined)
              onChoose(customDuration)
            } else {
              this.props.notify(
                fluxWizardError(`Invalid flux duration: ${customDuration}`)
              )
            }
          }
        }}
        onFocus={e => e.target.select()}
        spellCheck={false}
        autoComplete="false"
        autoFocus={true}
      />
    )
  }
  public handleClickOutside = () => {
    this.props.setCustomDuration(undefined)
  }
}

const CustomDurationInput = connect(null, {notify})(
  onClickOutside(DurationInput)
)

export default WindowPeriod
