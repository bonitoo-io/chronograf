import _ from 'lodash'
import {shiftDate} from 'shared/query/helpers'
import {map, reduce, forEach, concat, clone} from 'fast.js'

export const groupByTimeSeriesTransform = (raw = [], queryASTs = []) => {
  const groupBys = queryASTs.map(queryAST => {
    return _.get(queryAST, ['groupBy', 'tags'], false)
  })

  const results = reduce(
    raw,
    (acc, rawResponse, responseIndex) => {
      const responses = _.get(rawResponse, 'response.results', [])
      const indexedResponses = map(responses, response => ({
        ...response,
        responseIndex,
      }))
      return [...acc, ...indexedResponses]
    },
    []
  )

  // collect each series
  const serieses = reduce(
    results,
    (acc, {series = [], responseIndex}, index) => {
      return [...acc, ...map(series, item => ({...item, responseIndex, index}))]
    },
    []
  )
  // console.log('serieses', serieses)

  const size = reduce(
    serieses,
    (acc, {columns, values}) => {
      if (columns.length && (values && values.length)) {
        return acc + (columns.length - 1) * values.length
      }
      return acc
    },
    0
  )
  // console.log('size', size)

  // convert series into cells with rows and columns
  let cellIndex = 0
  let labels = []
  const DEFAULT_SIZE = 0
  const cells = {
    label: new Array(DEFAULT_SIZE),
    value: new Array(DEFAULT_SIZE),
    time: new Array(DEFAULT_SIZE),
    groupByVals: new Array(DEFAULT_SIZE),
    groupByLabels: new Array(DEFAULT_SIZE),
    seriesIndex: new Array(DEFAULT_SIZE),
    responseIndex: new Array(DEFAULT_SIZE),
  }
  forEach(
    serieses,
    ({
      name: measurement,
      columns,
      values,
      index: seriesIndex,
      responseIndex,
      tags = {},
    }) => {
      const rows = map(values || [], vals => ({
        vals,
      }))
      const groupByTags = groupBys[responseIndex]
      const groupByNotSelected = groupByTags.filter(
        gb => !_.includes(columns, gb)
      )

      const unsortedLabels = map(columns.slice(1), field => ({
        label: `${measurement}.${field}`,
        responseIndex,
        seriesIndex,
      }))
      labels = concat(labels, unsortedLabels)
      cells.groupByLabels = groupByNotSelected

      forEach(rows, ({vals}) => {
        const [time, ...rowValues] = vals
        forEach(rowValues, (value, i) => {
          cells.label[cellIndex] = unsortedLabels[i].label
          cells.value[cellIndex] = value
          cells.time[cellIndex] = time
          if (!_.isEmpty(groupByNotSelected)) {
            cells.groupByVals[cellIndex] = groupByNotSelected.map(
              gb => tags[gb]
            )
          }
          cells.seriesIndex[cellIndex] = seriesIndex
          cells.responseIndex[cellIndex] = responseIndex
          cellIndex++ // eslint-disable-line no-plusplus
        })
      })
    }
  )
  // console.log('cells', cells)
  const sortedLabels = _.sortBy(labels, 'label')
  const tsMemo = {}
  const nullArray = Array(sortedLabels.length).fill(null)

  const labelsToValueIndex = reduce(
    sortedLabels,
    (acc, {label, seriesIndex}, i) => {
      // adding series index prevents overwriting of two distinct labels that have the same field and measurements
      acc[label + seriesIndex] = i
      return acc
    },
    {}
  )
  // console.log('labelsToValueIndex', labelsToValueIndex)

  const timeSeries = []
  for (let i = 0; i < size; i++) {
    let time = cells.time[i]
    const value = cells.value[i]
    const label = cells.label[i]
    const seriesIndex = cells.seriesIndex[i]

    if (label.includes('_shifted__')) {
      const [, quantity, duration] = label.split('__')
      time = +shiftDate(time, quantity, duration).format('x')
    }

    let existingRowIndex = tsMemo[time]

    if (existingRowIndex === undefined) {
      timeSeries.push({
        time,
        values: clone(nullArray),
      })

      existingRowIndex = timeSeries.length - 1
      tsMemo[time] = existingRowIndex
    }

    timeSeries[existingRowIndex].values[
      labelsToValueIndex[label + seriesIndex]
    ] = value
  }
  // console.log('timeSeries', timeSeries)
  const sortedTimeSeries = _.sortBy(timeSeries, 'time')
  // console.log('sortedLabels', sortedLabels)
  // console.log('sortedTimeSeries', sortedTimeSeries)
  return {
    sortedLabels,
    sortedTimeSeries,
  }
}

// export const groupByTimeSeriesTransform = (raw = [], queryASTs = []) => {
//
//   raw.forEach((r, i) => {
//     const columnsInRaw = _.get(
//       r,
//       ['response', 'results', '0', 'series', '0', 'columns'],
//       []
//     )
//     const unselectedGroupBys = groupBys[i].filter(
//       gb => !_.includes(columnsInRaw, gb)
//     )
//     const series = _.get(r, ['response', 'results', '0', 'series'], [])
//     const result = reduce(
//       series,
//       (acc, s) => {
//         const seriesValues = s.values
//         const unselectedGroupBysTags = unselectedGroupBys.map(gb => s.tags[gb])
//
//         const seriesRows = map(seriesValues, v => [
//           v[0],
//           ...unselectedGroupBysTags,
//           ...v.slice(1),
//         ])
//         return _.concat(acc, seriesRows)
//       },
//       []
//     )
//     labels = [
//       series[0].columns[0],
//       ...unselectedGroupBys,
//       ...series[0].columns.slice(1),
//     ]
//     finalResult = _.concat(finalResult, result)
//   })
//   return {
//     sortedLabels: finalResult[0],
//     sortedTimeSeries: finalResult.slice(1),
//   }
// }