import Protocol from '../src/index.mjs'
import testType from './_test.mjs'
import { array, container } from '../src/datatypes/structures.mjs'

/**
 * This is not a real example or anything
 * Just a pseudo-data of neural network
 */

class MapEntries extends array {
  constructor ({ fields: { key, value }, ...count }, context) {
    super({
      type: [
        container,
        [
          { name: '0', type: key },
          { name: '1', type: value }
        ]
      ],
      ...count
    }, context)
  }

  read (buf) { return Object.fromEntries(super.read(buf)) }
  write (buf, val) { super.write(buf, Object.entries(val)) }
  sizeRead (buf) { return super.sizeRead(buf) }
  sizeWrite (val) { return super.sizeWrite(Object.entries(val)) }
}

const proto = new Protocol({
  types: {
    u8: 'native',
    f64: 'native',
    bool: 'native',
    array: 'native',
    option: 'native',
    switch: 'native',
    varint: 'native',
    container: 'native',
    pstring: 'native',
    short_string: [
      'pstring',
      { countType: 'u8' }
    ]
  },
  shell: {
    types: {
      layer: [
        MapEntries,
        {
          countType: 'varint',
          fields: {
            key: 'short_string',
            value: [
              MapEntries,
              {
                countType: 'varint',
                fields: {
                  key: 'short_string',
                  value: [
                    'switch',
                    {
                      compareTo: '0',
                      fields: {
                        bias: 'f64',
                        weights: [
                          MapEntries,
                          {
                            countType: 'varint',
                            fields: {
                              key: 'short_string',
                              value: 'f64'
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    },
    data: [
      'container',
      [
        { name: 'sizes', type: ['array', { countType: 'u8', type: 'varint' }] },
        {
          name: 'layers',
          type: ['array', {
            countType: 'u8',
            type: ['container', [
              { anon: true, type: ['option', 'layer'] }
            ]]
          }]
        },
        { name: 'outputLookup', type: 'bool' },
        { name: 'inputLookup', type: 'bool' },
        { name: 'activation', type: 'short_string' },
        {
          name: 'trainOpts',
          type: [
            'container',
            [
              { name: 'iterations', type: 'varint' },
              { name: 'errorThresh', type: 'f64' },
              { name: 'log', type: 'bool' },
              { name: 'logPeriod', type: 'varint' },
              { name: 'learningRate', type: 'f64' },
              { name: 'momentum', type: 'f64' },
              { name: 'callbackPeriod', type: 'varint' },
              { name: 'beta1', type: 'f64' },
              { name: 'beta2', type: 'f64' },
              { name: 'epsilon', type: 'f64' }
            ]
          ]
        }
      ]
    ]
  }
})

const sampleData = {
  sizes: [7, 3, 3],
  layers: [
    {
      positive: {},
      fun: {},
      pregnancy: {},
      kids: {},
      snuggle: {},
      chill: {},
      chores: {}
    },
    {
      0: {
        bias: -5.740667343139648,
        weights: {
          positive: 3.466144323348999,
          fun: 12.646774291992188,
          pregnancy: 5.405930995941162,
          kids: -0.20479299128055573,
          snuggle: 6.034560680389404,
          chill: -0.6554854512214661,
          chores: 0.4828799366950989
        }
      },
      1: {
        bias: 16.374238967895508,
        weights: {
          positive: -7.9960618019104,
          fun: -39.25760269165039,
          pregnancy: -14.53476619720459,
          kids: 6.444875240325928,
          snuggle: -25.877553939819336,
          chill: 2.4645464420318604,
          chores: 20.388572692871094
        }
      },
      2: {
        bias: 2.869173765182495,
        weights: {
          positive: -59.459129333496094,
          fun: -4.2791056632995605,
          pregnancy: 10.806180000305176,
          kids: -0.5158661007881165,
          snuggle: -0.1756911426782608,
          chill: 1.6968424320220947,
          chores: -6.287149429321289
        }
      }
    },
    {
      sad: {
        bias: -2.6917121410369873,
        weights: {
          0: 2.747654676437378,
          1: 1.6742931604385376,
          2: 1.3318161964416504
        }
      },
      angry: {
        bias: -3.333200216293335,
        weights: {
          0: 0.15586361289024353,
          1: 0.08514996618032455,
          2: 0.06244021654129028
        }
      },
      forgiveness: {
        bias: -3.3231587409973145,
        weights: {
          0: -2.0000393390655518,
          1: -1.0767207145690918,
          2: -1.95294988155365
        }
      }
    }
  ],
  outputLookup: true,
  inputLookup: true,
  activation: 'sigmoid',
  trainOpts: {
    iterations: 100000,
    errorThresh: 0.005,
    log: true,
    logPeriod: 100,
    learningRate: 0.01,
    momentum: 0.1,
    callbackPeriod: 10,
    beta1: 0.9,
    beta2: 0.999,
    epsilon: 1e-8
  }
}

testType({
  name: 'custom datatype (array > container)',
  type: proto.get('shell.data'),
  value: sampleData,
  bytes: 702
})
