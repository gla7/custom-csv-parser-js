const fs = require('fs'); // file system
const _ = require('lodash');
const shuffleSeed = require('shuffle-seed'); // given a seed, it shuffles in the same way for multiple arrays

function extractColumns(data, columnNames) {
  const headers = _.first(data);

  const indeces = _.map(columnNames, column => headers.indexOf(column));
  const extracted = _.map(data, row => _.pullAt(row, indeces));

  return extracted;
}

function loadCSV(
  filename,
  {
    converters = {},
    dataColumns = [],
    labelColumns = [],
    shuffle = true,
    seed = 'default',
    splitTest = false
  }
) {
  // the example csv in question intentionally has empty columns
  let data = fs.readFileSync(filename, { encoding: 'utf-8' }); // loads raw data from the csv
  data = data.split('\n').map(row => row.split(','));
  data = data.map(row => _.dropRightWhile(row, val => val === '')); // drop col on right if empty
  data = _.dropRightWhile(data, val => val.length === 0);

  const headers = _.first(data);

  data = data.map((row, index) => {
    if (index === 0) {
      return row;
    }

    return row.map((element, index) => {
      if (converters[headers[index]]) {
        const converted = converters[headers[index]](element);
        return _.isNaN(converted) ? element : converted;
      }

      const result = parseFloat(element);
      return _.isNaN(result) ? element : result;
    });
  });

  let labels = extractColumns(data, labelColumns);
  data = extractColumns(data, dataColumns)

  // remove column titles
  data.shift();
  labels.shift();

  if (shuffle) {
    data = shuffleSeed.shuffle(data, seed);
    labels = shuffleSeed.shuffle(labels, seed);
  }

  if (splitTest) {
    // split into number specified or 2 if just given true
    const trainSize = _.isNumber(splitTest) ? splitTest : Math.floor(data.length / 2);

    return {
      features: data.slice(0, trainSize),
      labels: labels.slice(0, trainSize),
      testFeatures: data.slice(trainSize), // takes from the trainSize no. element to the end of array
      testLabels: labels.slice(trainSize)
    }
  } else {
    return { features: data, labels };
  }
}

const { features, labels, testFeatures, testLabels } = loadCSV('data.csv', {
  dataColumns: ['height', 'value'],
  labelColumns: ['passed'],
  shuffle: true,
  seed: 'phrase',
  splitTest: 1,
  converters: {
    passed: val => val === 'TRUE'
  }
})

console.log('features: ', features);
console.log('labels: ', labels);
console.log('testFeatures: ', testFeatures);
console.log('testLabels: ', testLabels);
