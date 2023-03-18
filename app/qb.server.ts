import { json } from '@remix-run/server-runtime';
import OAuthClient from 'intuit-oauth';
import { getSupabase } from './supabase.server';
import { formatDate, timeSince } from './utils';

// Instance of intuit-oauth client
const oauthClient = new OAuthClient({
    clientId: process.env.REACT_APP_CLIENT_ID,
    clientSecret: process.env.REACT_APP_CLIENT_SECRET,
    environment: process.env.REACT_APP_ENVIRONMENT,
    redirectUri: process.env.REACT_APP_REDIRECT_URI,
});


interface QuickBooksQuery {
    select: string;
    from: string;
    where?: { [name: string]: string } | undefined;
    orderBy?: { column: string; order: 'ASC' | 'DESC' }[] | undefined;
    startPosition?: number;
    maxResults?: number;
}

function generateQuickBooksQuery(query: QuickBooksQuery): string {
    let queryString = `SELECT ${query.select} FROM ${query.from}`;

    if (query.where) {
        const whereClause = Object.entries(query.where)
            .map(([name, value]) => {
                if (name === 'TxnDate') {
                    return `${name}>='${value}'`;
                } else {
                    return `${name}='${value}'`;
                }
            })
            .join(' AND ');
        queryString += ` WHERE ${whereClause}`;
    }

    if (query.orderBy && query.orderBy.length > 0) {
        const orderByClause = query.orderBy
            .map((filter) => `${filter.column} ${filter.order}`)
            .join(', ');
        queryString += ` ORDERBY ${orderByClause}`;
    }

    if (query.startPosition) {
        queryString += ` STARTPOSITION ${query.startPosition}`;
    }

    if (query.maxResults) {
        queryString += ` MAXRESULTS ${query.maxResults}`;
    }

    return queryString;
}


// Ouath2
export async function authorise() {
    // AuthorizationUri
    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: 'testState',
    }); // can be an array of multiple scopes ex : {scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId]}

    // Redirect the authUri
    return authUri;
}

// GetUserInfo
export async function getUserInfo() {
    return oauthClient
        .makeApiCall({
            url:
                oauthClient.environment === 'sandbox'
                    ? OAuthClient.userinfo_endpoint_sandbox
                    : OAuthClient.userinfo_endpoint_production,
            method: 'GET',
        })
        .then((userInfo: any) => {
            return { userInfo: userInfo.getJson() };
        });
};

// GetCompanyInfo
export const getCompanyInfo = (userInfo: any) => {
    const companyID = oauthClient.getToken().realmId;

    const url =
        oauthClient.environment === 'sandbox'
            ? OAuthClient.environment.sandbox
            : OAuthClient.environment.production;

    return oauthClient
        .makeApiCall({ url: `${url}v3/company/${companyID}/companyinfo/${companyID}` })
        .then((companyInfo: any) => {
            return Object.assign({ ...companyInfo.getJson() }, userInfo);
        })
        .catch(function (e: any) {
            console.error(e);
        });
};

export async function authenticate(url: string) {

    return oauthClient
        .createToken(url)
        .then(getUserInfo)
        .then(getCompanyInfo)
        .then(async (response: any) => {
            var token = await refreshToken();
            return { response, token };
        })
        .catch(function (e: { intuit_tid: any; }) {
            console.error(e.intuit_tid);
        });
}

export async function refreshToken() {
    var token = oauthClient.getToken();
    return token;
}

export async function getBearerToken(request: Request) {
    const { data } = await getSupabase(request).from("tokens").select().single();

    oauthClient.getToken().setToken({
        "realmId": data?.realm_id,
        "token_type": "bearer",
        "expires_in": data?.access_expires_in - timeSince(new Date(data?.updated_at)),
        "refresh_token": data?.refresh_token,
        "x_refresh_token_expires_in": data?.refresh_expires_in - timeSince(new Date(data?.created_at)),
        "access_token": data?.access_token,
    });

    if (oauthClient.isAccessTokenValid()) {
        console.log("token is valid");
        return { token: oauthClient.getToken(), realmId: data?.realm_id };
    }

    if (!oauthClient.isAccessTokenValid()) {
        try {
            console.log("token is invalid");
            const authResponse = await oauthClient.refresh();

            await getSupabase(request).from("tokens").upsert({
                access_token: authResponse.getJson()?.access_token,
                access_expires_in: authResponse.getJson()?.expires_in,
                updated_at: new Date(),
                realm_id: data?.realm_id
            })
            return { token: authResponse.getJson(), realmId: data?.realm_id };
        } catch (error) {
            throw error
        }
    }
}

export async function makeApiQuery(request: Request, query: string) {
    var token = await getBearerToken(request);

    const url =
        oauthClient.environment === 'sandbox'
            ? OAuthClient.environment.sandbox
            : OAuthClient.environment.production;

    return oauthClient
        .makeApiCall({ url: `${url}v3/company/${token?.realmId}/query?query=${query}` })
}

const parseParams = (str: string) => {
    if (!str) return undefined;

    const obj = str.split("|").reduce((prev, curr) => {
        const [key, value] = curr.split(":");
        return { ...prev, [key]: value };
    }, {});
    return obj
}

export async function getQBObjects(request: Request, object: string) {
    const searchParams = new URLSearchParams(request.url.split('?')[1]);

    const startPosition = parseInt(searchParams.get("startPosition")!) || 1;
    const maxResults = parseInt(searchParams.get("maxResults")!) || 10;
    const where = parseParams(searchParams.get("where")!) || { TxnDate: formatDate() };

    const query: QuickBooksQuery = {
        select: '*',
        from: object,
        where: object === "Item" ? undefined : where,
        orderBy: object === "Item" ? undefined : [
            { column: 'TxnDate', order: 'DESC' },
        ],
        startPosition,
        maxResults,
    };

    const queryString = generateQuickBooksQuery(query);
    console.log(queryString);

    try {
        const result = await makeApiQuery(request, queryString);
        return json(result.getJson(), 200);
    } catch (error: any) {
        console.log(error)
        return json({
            error: error.error,
            description: error.error_description,
            intuit_tid: error.intuit_tid
        }, error.authResponse.response.status)
    }
}

export const getInvoices = async (request: Request) => getQBObjects(request, "Invoice");

export const getReceipts = async (request: Request) => getQBObjects(request, "SalesReceipt");

export const getItems = async (request: Request) => getQBObjects(request, "Item");

export async function makeUpdate(request: Request, object: string) {
    await getBearerToken(request);

    const url =
        oauthClient.environment === 'sandbox'
            ? OAuthClient.environment.sandbox
            : OAuthClient.environment.production;

    const body = await request.json()

    try {
        const result = await oauthClient
            .makeApiCall({
                url: `${url}v3/company/4620816365270083480/${object}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: { ...body, "sparse": true },
            });
        return json(result.getJson(), 200);
    } catch (error: any) {
        console.log(error)
        return json({
            error: error.error,
            description: error.error_description,
            intuit_tid: error.intuit_tid
        }, error.authResponse.response.status)
    }
}

export const updateInvoice = async (request: Request) => makeUpdate(request, "invoice");

export const updateReceipt = async (request: Request) => makeUpdate(request, "salesreceipt");
