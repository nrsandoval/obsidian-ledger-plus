import moment from 'moment';

export interface Posting {
    account: string;
    commodity: string;
    amount: number;
    note: string;
}

export interface Transaction {
    date: moment.Moment;
    payee: string;
    posting: Posting[];
    cleared: boolean;
}

const transactionDateRegex = /(\d+[-/]\d+[-/]\d+)( \*)? (.*)/;
const postingRegex = /(?: {2,}|\t+)((?:[\w\d:]+ ?)+)(?: {2,}|\t+)?(\$ *)?([\w\d,.-]+)?(?:[ \t]+;[ \t]*)?(.*)/gm;

export const parseTransaction = (
    fileContents: string
): Transaction | null => {
    const dateLineMatches = fileContents.match(transactionDateRegex);
    if (dateLineMatches == null) {
        return null;
    }

    const date = moment(dateLineMatches[1], "YYYY/MM/DD");
    const cleared = dateLineMatches[2] != null;
    const payee = dateLineMatches[3];

    const postingList: Posting[] = [];
    const elidide = {
        commodity: "",
        amount: 0
    };
    const postingLineMatches = [ ...fileContents.matchAll(postingRegex)];
    postingLineMatches.forEach(match => {
        const account = match[1].trim();
        const note = match[4];
        let commodity = "";
        let amount = 0;

        if (match[2] == undefined) {
            commodity = elidide.commodity;
            amount = elidide.amount;
        } else {
            commodity = match[2].trim();
            amount = Number(match[3].replace(",", "").trim());
            elidide.commodity = commodity;
            elidide.amount -= amount;   
        }

        postingList.push({
            account: account,
            commodity: commodity,
            amount: amount,
            note: note
        });
    });

    return {
        date: date,
        payee: payee,
        posting: postingList,
        cleared: cleared
    };
};