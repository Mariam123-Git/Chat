import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getConnecterUser(request) {
   // let token = new Headers(request.headers).get('Authentication');
    let token = new Headers(request.headers).get('Authorization'); // au lieu de 'Authentication'

    if (token === undefined || token === null || token === "") {
        return null;
    } else {
        token = token.replace("Bearer ", "");
    }
    console.log("checking " + token);
    const user = await redis.get(token);
    console.log("Got user : " + user.username);
    return user;
}

export async function checkSession(request) {
    const user = await getConnecterUser(request);
    // console.log(user);
    return (user !== undefined && user !== null && user);
}

export function unauthorizedResponse() {
    const error = {code: "UNAUTHORIZED", message: "Session expired"};
    return new Response(JSON.stringify(error), {
        status: 401,
        headers: {'content-type': 'application/json'},
    });
}

export function triggerNotConnected() {
    return new Response(
        JSON.stringify({ code: "UNAUTHORIZED", message: "Session expired" }),
        {
            status: 401,
            headers: { "content-type": "application/json" },
        }
    );
}
