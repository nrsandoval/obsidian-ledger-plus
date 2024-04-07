import {describe, expect, test } from '@jest/globals';
import moment from 'moment';
import {
    parseTransaction
} from '../src/parser/transaction'

/*
const ledgerContents = 
`; -*- ledger -*-

= /^Income/
  (Liabilities:Tithe)                    0.12

;~ Monthly
;  Assets:Checking                     $500.00
;  Income:Salary

;~ Monthly
;   Expenses:Food  $100
;   Assets

2010/12/01 * Checking balance
  Assets:Checking                   $1,000.00
  Equity:Opening Balances

2010/12/20 * Organic Co-op
  Expenses:Food:Groceries             $ 37.50  ; [=2011/01/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/02/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/03/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/04/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/05/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/06/01]
  Assets:Checking                   $ -225.00

2010/12/28=2011/01/01 Acme Mortgage
  Liabilities:Mortgage:Principal    $  200.00
  Expenses:Interest:Mortgage        $  500.00
  Expenses:Escrow                   $  300.00
  Assets:Checking                  $ -1000.00

2011/01/02 Grocery Store
  Expenses:Food:Groceries             $ 65.00
  Assets:Checking

2011/01/05 Employer
  Assets:Checking                   $ 2000.00
  Income:Salary

2011/01/14 Bank
  ; Regular monthly savings transfer
  Assets:Savings                     $ 300.00
  Assets:Checking

2011/01/19 Grocery Store
  Expenses:Food:Groceries             $ 44.00 ; hastag: not block
  Assets:Checking

2011/01/25 Bank
  ; Transfer to cover car purchase
  Assets:Checking                  $ 5,500.00
  Assets:Savings
  ; :nobudget:

apply tag hastag: true
apply tag nestedtag: true
2011/01/25 Tom's Used Cars
  Expenses:Auto                    $ 5,500.00
  ; :nobudget:
  Assets:Checking

2011/01/27 Book Store
  Expenses:Books                       $20.00
  Liabilities:MasterCard
end tag
2011/12/01 Sale
  Assets:Checking:Business            $ 30.00
  Income:Sales
end tag`;
*/

describe('transaction parsing', () => {
    test('parse transaction 1', () => {
        const result = parseTransaction(
`2011/01/02 Grocery Store
        Expenses:Food:Groceries             $ 65.00
        Assets:Checking`);
        expect(result).not.toBeNull();
        expect(result?.date).toEqual(moment('2011/01/02', "YYYY/MM/DD"));
        expect(result?.payee).toEqual("Grocery Store");
        expect(result?.cleared).toEqual(false);
        expect(result?.posting[0]).toEqual({
            account: "Expenses:Food:Groceries",
            commodity: "$",
            amount: 65.00,
            note: ""
        })
        expect(result?.posting[1]).toEqual({
            account: "Assets:Checking",
            commodity: "$",
            amount: -65.00,
            note: ""
        })
    });

    test('parse transaction 2', () => {
        const result = parseTransaction(
`2010/12/01 * Checking balance
\tAssets:Checking                   $1,000.00
\tEquity:Opening Balances`);
        expect(result).not.toBeNull()
        expect(result?.date).toEqual(moment('2010/12/01', 'YYYY/MM/DD'));
        expect(result?.cleared).toEqual(true);
        expect(result?.posting[0]).toEqual({
            account: "Assets:Checking",
            commodity: "$",
            amount: 1000.00,
            note: ""
        });
        expect(result?.posting[1]).toEqual({
            account: "Equity:Opening Balances",
            commodity: "$",
            amount: -1000,
            note: ""
        })
    })

    test('parse transaction 3', () => {
        const result = parseTransaction(
`2010/12/20 * Organic Co-op
  Expenses:Food:Groceries             $ 37.50  ; [=2011/01/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/02/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/03/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/04/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/05/01]
  Expenses:Food:Groceries             $ 37.50  ; [=2011/06/01]
  Assets:Checking                   $ -225.00`);
        const posting = {
            account: "Expenses:Food:Groceries",
            commodity: "$",
            amount: 37.50,
        }
        expect(result).not.toBeNull();
        expect(result?.cleared).toEqual(true);
        expect(result?.date).toEqual(moment('2010/12/20', 'YYYY/MM/DD'));
        expect(result?.payee).toEqual("Organic Co-op")
        expect(result?.posting[0]).toEqual({ ...posting, note: "[=2011/01/01]"});
        expect(result?.posting[1]).toEqual({ ...posting, note: "[=2011/02/01]"});
        expect(result?.posting[2]).toEqual({ ...posting, note: "[=2011/03/01]"});
        expect(result?.posting[3]).toEqual({ ...posting, note: "[=2011/04/01]"});
        expect(result?.posting[4]).toEqual({ ...posting, note: "[=2011/05/01]"});
        expect(result?.posting[5]).toEqual({ ...posting, note: "[=2011/06/01]"});
        expect(result?.posting[6]).toEqual({
            account: "Assets:Checking",
            commodity: "$",
            amount: -225,
            note: ""
        })
        
    })

    test('parse transaction 4', () => {
        const result = parseTransaction(
`2011/01/25 Bank
    ; Transfer to cover car purchase
    Assets:Checking                  $ 5,500.00
    Assets:Savings
    ; :nobudget:`);
        expect(result).not.toBeNull();
        expect(result?.cleared).toEqual(false);
        expect(result?.date).toEqual(moment('2011/01/25', 'YYYY/MM/DD'));
        expect(result?.payee).toEqual("Bank")
        expect(result?.posting[0]).toEqual({
            account: "Assets:Checking",
            amount: 5500,
            commodity: "$",
            note: ""
        })
        expect(result?.posting[1]).toEqual({
            account: "Assets:Savings",
            amount: -5500,
            commodity: "$",
            note: ""
        })
    })
});