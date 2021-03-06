import React from 'react'
import * as createClass from 'create-react-class'
import * as reactRedux from 'react-redux'
import * as redux from 'redux'
import * as reselect from 'reselect'
import * as immutable from 'immutable'

import {actions} from './state'
import {SkuPopup} from './popup'
import selectors from './selectors'
import EditableCell from './editable_cell'

const SkuCell = createClass({
  displayName: 'MpnCell',
  getInitialState() {
    return {triggered: false}
  },
  render() {
    const props = this.props
    const {editing, value, lineId, field, setField, setFocus, active} = props
    const cell = (
      <EditableCell
        field={field}
        value={value}
        lineId={lineId}
        setField={setField}
        setFocus={setFocus}
        loseFocus={props.loseFocus}
        active={active}
        editing={editing}
        wand={props.wand}
        setFocusBelow={props.setFocusBelow}
        setFocusNext={props.setFocusNext}
      />
    )
    if (props.wand || props.selected > -1) {
      return (
        <SkuPopup
          on="click"
          trigger={cell}
          field={field}
          lineId={props.lineId}
          position="bottom center"
          suggestions={props.suggestions}
          selected={props.selected}
          setField={setField}
          remove={props.remove}
        />
      )
    }
    return cell
  }
})

function retailerSelector(_, props) {
  return props.field.get(1)
}

function makeApplicableSuggestions() {
  return reselect.createSelector(
    [selectors.suggestions, selectors.lineId, retailerSelector],
    (suggestions, lineId, retailer) => {
      suggestions = suggestions.getIn([lineId, 'data']) || immutable.List()
      return suggestions.flatMap(s => {
        const type = s.get('type')
        const mpn = s.get('mpn')
        const offers = s
          .get('offers')
          .filter(o => o.getIn(['sku', 'vendor']) === retailer)
        return offers.map(o => o.merge({type, mpn}))
      })
    }
  )
}

function makeWandSelector(applicableSuggestionsSelector, valueSelector) {
  const loading = selectors.makeSuggestionsLoading()
  return reselect.createSelector(
    [applicableSuggestionsSelector, valueSelector, loading],
    (suggestions, value, loading) => {
      if (value) {
        return false
      }
      if (loading) {
        return 'loading'
      }
      return !value && suggestions.getIn([0, 'type'])
    }
  )
}

function makeSkuSelector() {
  const value = selectors.makeValueSelector()
  return reselect.createSelector([retailerSelector, value], (vendor, part) =>
    immutable.Map({vendor, part})
  )
}

function makeSelectedSelector(suggestions) {
  const skuSelector = makeSkuSelector()
  return reselect.createSelector(
    [suggestions, skuSelector],
    (suggestions, sku) => suggestions.findIndex(s => s.get('sku').equals(sku))
  )
}

function mapStateToProps() {
  const active = selectors.makeActiveSelector()
  const editing = selectors.makeEditingSelector()
  const value = selectors.makeValueSelector()
  const suggestions = makeApplicableSuggestions()
  const wand = makeWandSelector(suggestions, value)
  const selected = makeSelectedSelector(suggestions)
  return reselect.createSelector(
    [value, editing, active, suggestions, wand, selected],
    (value, editing, active, suggestions, wand, selected) => ({
      value,
      editing,
      active,
      suggestions,
      wand,
      selected
    })
  )
}

function mapDispatchToProps(dispatch) {
  return redux.bindActionCreators(actions, dispatch)
}

export default reactRedux.connect(mapStateToProps, mapDispatchToProps)(
  SkuCell
)
