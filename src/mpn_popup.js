import './mpn_popup.css'

const React       = require('react')
const createClass = require('create-react-class')
const {h, a, div} = require('react-hyperscript-helpers')
const semantic    = require('semantic-ui-react')
const ramda       = require('ramda')
const immutable   = require('immutable')


const importance = [
  ['color', 'capacitance', 'resistance'],
  ['case_package'],
  ['dielectric_characteristic'],
  ['resistance_tolerance', 'capacitance_tolerance'],
  ['voltage_rating', 'power_rating'],
  ['pin_count'],
  ['case_package_si'],
]

function chunkArray(arr, chunkSize) {
    var groups = [], i;
    for (i = 0; i < arr.length; i += chunkSize) {
        groups.push(arr.slice(i, i + chunkSize));
    }
    return groups;
}

function reorder(specs) {
  const groups = specs.reduce((acc, spec) => {
    let index = importance.reduce((prev, keys, index) => {
      if (keys.indexOf(spec.key) >= 0) {
        return index
      }
      return prev
    }, null)
    if (index == null) {
      index = acc.length - 1
    }
    acc[index].push(spec)
    return acc
  }, importance.map(x => []).concat([[]]))
  return ramda.flatten(groups)
}

function specRow(spec) {
  return h(semantic.Table.Row, [
    h(semantic.Table.Cell, spec.name),
    h(semantic.Table.Cell, spec.value),
  ])
}

const MpnPopup = createClass({
  getInitialState() {
    return {expanded: false}
  },
  toggleExpanded() {
    this.setState({expanded: !this.state.expanded})
  },
  render() {
    const props  = this.props
    const part   = props.part || immutable.Map()
    const image  = part.get('image') || immutable.Map()
    const mpn    = part.get('mpn') || immutable.Map()
    const number = mpn.get('part')
    let specs    = reorder(part.get('specs') || [])
    if (! this.state.expanded) {
      specs = specs.slice(0, 4)
    }
    const tableData = specs.map(spec => [spec.get('name'), spec.get('value')])
    const table = h(semantic.Table, {
      basic   : 'very',
      compact : true,
      tableData,
      renderBodyRow(args) {
        return (
          <semantic.Table.Row key={String(args)}>
            {args.map(text => (
              <semantic.Table.Cell key={text}>
                {text}
              </semantic.Table.Cell>
            ))}
          </semantic.Table.Row>
        )
      },
    })
    let expandButton
    if (part.get('specs') && part.get('specs').size > 4) {
      expandButton = (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <semantic.Button
            onClick = {this.toggleExpanded}
            size    = 'tiny'
            basic   = {true}
          >
            {this.state.expanded ? '⇡' : '...'}
          </semantic.Button>
        </div>
      )
    }
    return (
      <semantic.Popup
        className       = 'MpnPopup'
        hoverable       = {true}
        mouseLeaveDelay = {200}
        mouseEnterDelay = {200}
        position        = {props.position}
        trigger         = {props.trigger}
        onOpen          = {props.onOpen}
        onClose         = {props.onClose}
        flowing         = {true}
        open            = {props.open}
        offset          = {props.offset}
        on              = {props.on}
      >
        <semantic.Button.Group style={{marginBottom: 10}} basic fluid>
          <semantic.Button
            disabled={!part.size}
            icon='left chevron'
          />
          <semantic.Button
            disabled={!part.size}
            icon='square outline'
            content='Select'
          />
          <semantic.Button
            disabled={!part.size}
            icon='right chevron'
          />
        </semantic.Button.Group>
        {(() => {
          if (part.size === 0) {
            return (
              <div style={{maxWidth: 300}}>
                {
                  `Sorry, could not find any matching parts. Please try adding
                    more information in other fields.`
                }
              </div>
            )
          }
          return (
            <div className='topAreaContainer'>
              <div
                style={{
                  display: 'flex',
                  flexDirection:'column',
                  justifyContent: 'space-between'
                }}
              >
                <div className='imageContainer'>
                  <semantic.Image src={image.get('url')} />
                </div>
                <a style={{fontSize: 9}} href={image.get('credit_url')}>
                  {image.get('credit_string')}
                </a>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start'
                  }}
                >
                  <a
                    style={{fontSize: 10}}
                    href={'https://octopart.com' + (number ? `/search?q=${number}` : '')}
                  >
                    Powered by Octopart
                  </a>
                </div>
              </div>
              <div style={{marginLeft: 20}}>
                <div style={{maxWidth: 200}}>
                  {part.get('description')}
                </div>
                <div style={{marginTop: 15, display:'flex', justifyContent: 'center'}} >
                  <a href={part.get('datasheet')}>
                    <semantic.Icon name='file pdf outline' />
                    Datasheet
                  </a>
                </div>
                {table}
                {expandButton}
              </div>
            </div>
          )
        })()}
      </semantic.Popup>
    )
  },
})

export default MpnPopup
