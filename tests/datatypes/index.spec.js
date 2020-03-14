import testType from '../_test.mjs'
import * as dt from '../../src/datatypes/index.mjs'

testType({
  name: 'complex (no countFields)',
  type: dt.container,
  value: {
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
  bytes: 53,
  params: [
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
})
