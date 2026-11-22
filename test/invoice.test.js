'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function item(name, hsn, price, qty, gstRate) {
  return {
    name: name,
    sku: name.toUpperCase().replace(/\s+/g, '-'),
    hsn: hsn,
    price: price,
    qty: qty,
    gstRate: gstRate
  };
}

function characterize(order, expectedInvoice) {
  var invoiceFigures = invoice.computeInvoiceFigures(order);
  var pricingFigures = pricing.computeTotals(order.items, order.coupon);

  // Both paths receive the same in-memory items and coupon; invoice figures must match checkout.
  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    lines: invoiceFigures.rows.map(function (row) {
      return {
        gstPercent: row.gstPercent,
        gross: row.line,
        discount: row.lineDiscount,
        taxable: row.taxable,
        tax: row.lineTax
      };
    })
  }, {
    subtotal: pricingFigures.subtotal,
    discount: pricingFigures.discount,
    tax: pricingFigures.tax,
    cgst: pricingFigures.cgst,
    sgst: pricingFigures.sgst,
    total: pricingFigures.total,
    lines: pricingFigures.lines.map(function (line) {
      return {
        gstPercent: line.gstPercent,
        gross: line.gross,
        discount: line.discount,
        taxable: line.taxable,
        tax: line.tax
      };
    })
  });
  assert.deepEqual(invoiceFigures, expectedInvoice);
}

test('CURRENT BEHAVIOUR: #1001 applies the provided 5% and 12% rates without a coupon', function () {
  characterize({
    id: 1001,
    coupon: '',
    items: [
      item('Rice', '1006', 640, 1, 5),
      item('Ghee', '0405', 160, 1, 12)
    ]
  }, {
    subtotal: 800,
    discount: 0,
    tax: 51.2,
    cgst: 25.6,
    sgst: 25.6,
    total: 851.2,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineDiscount: 0, taxable: 640, lineTax: 32 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 160, gstPercent: 12, line: 160, lineDiscount: 0, taxable: 160, lineTax: 19.2 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1002 applies SAVE10 before GST and matches checkout', function () {
  characterize({
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item('Rice', '1006', 400, 1, 5),
      item('Ghee', '0405', 200, 1, 12)
    ]
  }, {
    subtotal: 600,
    discount: 60,
    tax: 39.6,
    cgst: 19.8,
    sgst: 19.8,
    total: 579.6,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 400, gstPercent: 5, line: 400, lineDiscount: 40, taxable: 360, lineTax: 18 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 200, gstPercent: 12, line: 200, lineDiscount: 20, taxable: 180, lineTax: 21.6 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1004 applies the ₹150 SAVE10 cap before GST', function () {
  characterize({
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item('Rice', '1006', 1000, 1, 5),
      item('Ghee', '0405', 1240, 1, 12)
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 185.49,
    cgst: 92.75,
    sgst: 92.74,
    total: 2275.49,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 1000, gstPercent: 5, line: 1000, lineDiscount: 66.96, taxable: 933.04, lineTax: 46.65 },
      { name: 'Ghee', sku: 'GHEE', hsn: '0405', qty: 1, price: 1240, gstPercent: 12, line: 1240, lineDiscount: 83.04, taxable: 1156.96, lineTax: 138.84 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 computes 18% GST on all lines without a coupon', function () {
  characterize({
    id: 1008,
    coupon: '',
    items: [
      item('Packaged Tea', '0902', 250, 2, 18)
    ]
  }, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Packaged Tea', sku: 'PACKAGED-TEA', hsn: '0902', qty: 2, price: 250, gstPercent: 18, line: 500, lineDiscount: 0, taxable: 500, lineTax: 90 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice matches checkout HSN GST and capped SAVE10', function () {
  var order = {
    id: 1004,
    coupon: 'SAVE10',
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    total: 2194.5,
    items: [
      item('Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2, undefined)
    ]
  };

  characterize(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      {
        name: 'Cold-Pressed Groundnut Oil 5L',
        sku: 'COLD-PRESSED-GROUNDNUT-OIL-5L',
        hsn: '1508',
        qty: 2,
        price: 1120,
        gstPercent: 5,
        line: 2240,
        lineDiscount: 150,
        taxable: 2090,
        lineTax: 104.5
      }
    ]
  });

  assert.ok(invoice.render(order).indexOf('Coupon discount: -₹150.00 · Taxable: ₹2090.00') !== -1);
});
