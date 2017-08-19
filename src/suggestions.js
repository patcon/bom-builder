const immutable = require('immutable')
const getPartinfo = require('./get_partinfo')

function fromRetailers(retailers, suggestions) {
  const suggestionSkus = suggestions.flatMap(s => {
    return s.get('offers').map(offer => offer.get('sku'))
  })

  const skus = retailers.entrySeq().map(([vendor, part]) => {
    if (vendor === 'Digikey') {
      vendor = 'Digi-Key'
    } else if (vendor === 'RS') {
      vendor = 'RS Components'
    }
    if (part !== '') {
      return {vendor, part}
    }
    return null
  })
    .filter(x => x != null)
    .filter(part => !suggestionSkus.includes(part))

  return Promise.all(skus.map(getPartinfo))
    .then(ps => ps.filter(x => x != null))
    .then(ps => immutable.fromJS(ps))
}

function fromPartNumbers(partNumbers, suggestions) {
  const suggestionMpns = suggestions.flatMap(s => s.get('partNumbers'))
  partNumbers = partNumbers
    .filter(mpn => mpn.get('part'))
    .filter(mpn => !suggestionMpns.includes(mpn))
    .map(mpn => mpn.toJS())
  return Promise.all(partNumbers.map(getPartinfo))
    .then(ps => ps.filter(x => x != null))
    .then(ps => immutable.fromJS(ps))
}

function fromDescription(description) {
  return getPartinfo(description)
    .then(ps => ps && ps.filter(x => x != null))
    .then(ps => immutable.fromJS(ps))
}

async function findSuggestions(line, suggestions=immutable.List(), actions) {
  let parts = await fromPartNumbers(line.get('partNumbers'), suggestions)
  suggestions = suggestions.concat(parts)
  const rs = await fromRetailers(line.get('retailers'), suggestions)
  suggestions = suggestions.concat(rs)
  const ds = await fromDescription(line.get('description'))
  if (ds) {
    suggestions = suggestions.concat(ds)
  }
  actions.setSuggestions({
    id: line.get('id'),
    //make unique
    suggestions: suggestions.toOrderedSet().toList(),
  })
}

export {findSuggestions}
