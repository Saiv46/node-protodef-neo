import test from 'ava'
import { constructedMacro } from './macros.js'
import * as dt from '../src/datatypes/index.js'

test(
  'container (nested + array)',
  constructedMacro,
  dt.container,
  {
    active: true,
    name: 'Saiv46',
    level: 90,
    position: {
      x: 335,
      y: 64,
      z: -201
    },
    items: [
      {
        id: 123456,
        label: 'Useless item',
        amount: 234
      },
      {
        id: 543210,
        label: 'Another item',
        amount: 3
      }
    ]
  },
  53,
  [
    { name: 'active', type: dt.bool },
    {
      name: 'name',
      type: [
        dt.pstring,
        { countType: dt.varint }
      ]
    },
    { name: 'level', type: dt.u8 },
    {
      name: 'position',
      type: [
        dt.bitfield,
        [
          { name: 'x', size: 26, signed: true },
          { name: 'y', size: 12, signed: true },
          { name: 'z', size: 26, signed: true }
        ]
      ]
    },
    {
      name: 'items',
      type: [
        dt.array,
        {
          type: [
            dt.container,
            [
              {
                name: 'id',
                type: [
                  dt.int,
                  { size: 3 }
                ]
              },
              { name: 'label', type: dt.cstring },
              { name: 'amount', type: dt.u8 }
            ]
          ],
          countType: dt.u16
        }
      ]
    }
  ]
)

test(
  'array (container + switch)',
  constructedMacro,
  dt.array,
  [
    { type: 1 },
    { type: 2, title: 'Welcome' },
    { type: 3, subtitle: 'to the c*m zone' },
    { type: 4, id: 65535 }
  ],
  31,
  {
    countType: dt.varint,
    type: [
      dt.container,
      [
        { name: 'type', type: dt.u8 },
        {
          anon: true,
          type: [
            dt.switch,
            {
              compareTo: 'type',
              fields: {
                1: dt.void,
                2: [dt.container, [{ name: 'title', type: dt.cstring }]],
                3: [dt.container, [{ name: 'subtitle', type: [dt.pstring, { countType: dt.varint }] }]],
                4: [dt.container, [{ name: 'id', type: dt.u16 }]]
              }
            }
          ]
        }
      ]
    ]
  }
)

const recursion = [
  dt.container,
  [
    { name: 'a', type: dt.u8 },
    {
      name: 'b',
      type: [
        dt.switch,
        {
          compareTo: 'a',
          fields: { 0: dt.cstring }
        }
      ]
    }
  ]
]
recursion[1][1].type[1].default = recursion

const recursionValue = {}
let recursionBytes = 0
for (let i = 16, v = recursionValue; i > -1; i--) {
  v.a = i
  recursionBytes++
  if (i) {
    v.b = {}
    v = v.b
  } else {
    v.b = 'String'
    recursionBytes += 7
  }
}

test(
  'recursion (container + switch)',
  constructedMacro,
  recursion[0],
  recursionValue,
  recursionBytes,
  recursion[1]
)
