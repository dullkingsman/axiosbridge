# AxiosBridge
A wrapper for axios that converts `Promises` form incoming responses
to `Result` monads.

<b>Usage</b>:

```typescript
import {Bridge} from "axios-bridge";

// ...

// Create a bridge class that has a single static 
// instance of the Bridge. This is to ensure that 
// axios instances are not being created all over.

class APIBridge {
    protected static bridge: Bridge = new Bridge({
        baseURL: "<your-host-url>",
    });

    // the following code is an example code 
    // it is not required.
    
    protected static _access_token: string | undefined = undefined;

    static set access_token(token: string) {
        this._access_token = token;
        this.setAuthHeader(token);
    }

    private static setAuthHeader(token: string) {
        this.bridge.axios_instance.defaults.headers.common[
            "Authorization"
            ] = `Bearer ${token}`;

        return this;
    }
}

// ...

// create resuest and response types

interface RegisterReqModel {
    phoneNumber: string;
    fullName: string;
}

interface RegisterResponseModel {
    accessToken: string;
}

// create a resources class that has endpoints

class Auth extends APIBridge {
    static register(data: RegisterReqModel) {
        return super.bridge.post<RegisterReqModel, RegisterResponseModel, Error>(
            "/auth/register",
            data
        );
    }
}

// ...

// Although the api call can be handled in custom 
// ways, there some utility funcitons are provided
// fot that purpose. 

await execSafeAsync(
    async () =>
        Auth.register({
            phoneNumber: "some-phone-number",
            fullName: "some-name",
        }),
    {
        onFulfilled: (result) => {
            APIBridge.access_token = result.accessToken;
        },
        onError: (error) => console.error(error),
        _finally: () => console.log("I get logged after the handlers are done in both cases."),
    }
);

```
