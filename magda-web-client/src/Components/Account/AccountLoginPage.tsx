import React, { useState } from "react";
import fbLogo from "assets/login/fb-logo.svg";
import googleLogo from "assets/login/google-logo.svg";
import arcgisLogo from "assets/login/esri-logo.svg";
import aafLogo from "assets/login/aaf-logo.png";
import ckanLogo from "assets/login/ckan.png";
import magdaLogo from "assets/login/magda.png";
import "./AccountLoginPage.scss";
import { getAuthProviders } from "api-clients/AuthApis";
import { config } from "config";
import { useAsync } from "react-async-hook";
import CommonLink from "Components/Common/CommonLink";
import urijs from "urijs";
const { baseUrl, uiBaseUrl } = config;

function getDefaultLoginFormProvider(providers: string[]): string {
    if (!providers || !providers.length) {
        return "";
    }
    if (providers.indexOf("internal") !== -1) {
        return "internal";
    } else if (providers.indexOf("ckan") !== -1) {
        return "ckan";
    } else {
        return "";
    }
}

export default function Login(props) {
    const {
        result: providers,
        loading: isProvidersLoading,
        error: providersLoadingError
    } = useAsync(async () => {
        const providers = await getAuthProviders();
        setLoginFormProvider((value) => getDefaultLoginFormProvider(providers));
        return providers;
    }, []);

    const [loginFormProvider, setLoginFormProvider] = useState<string>("");

    const previousUrl =
        props.location.state &&
        props.location.state.from &&
        props.location.state.from.pathname
            ? props.location.state.from.pathname
            : "/account";

    const oauthRedirect = urijs(window.location.href)
        .search("")
        .fragment("")
        .segment([uiBaseUrl, "sign-in-redirect"])
        .search({
            redirectTo: previousUrl
        })
        .toString();

    const makeLoginUrl = (type) =>
        `${baseUrl}auth/login/${type}?redirect=${encodeURIComponent(
            oauthRedirect
        )}`;

    const createLoginForm = () => {
        if (!loginFormProvider) {
            return null;
        }

        const providerName =
            loginFormProvider === "internal" ? "Magda" : "Data.gov.au";

        const username =
            loginFormProvider === "internal" ? "Email Address" : "User name";

        return (
            <div className="col-sm-6 col-md-5">
                <h2>Sign In with {providerName}</h2>
                <p>This will use your existing {providerName} account.</p>
                <form
                    action={makeLoginUrl(loginFormProvider)}
                    method="post"
                    className="login__form"
                >
                    <div className="login__input-group input-group">
                        <div className="input-group-addon">
                            <span className="glyphicon glyphicon-user" />
                        </div>
                        <label htmlFor="username">{username}</label>
                        <input
                            className="au-text-input au-text-input--block"
                            id="username"
                            type="text"
                            placeholder={username}
                            name="username"
                        />
                    </div>
                    <div className="login__input-group input-group">
                        <div className="input-group-addon">
                            <span className="glyphicon glyphicon-lock" />
                        </div>
                        <label htmlFor="password">Password</label>
                        <input
                            className="au-text-input au-text-input--block"
                            type="password"
                            name="password"
                            placeholder="Password"
                        />
                    </div>
                    <div className="pull-right">
                        <input
                            type="submit"
                            className="au-btn"
                            value="Sign in"
                        />
                    </div>
                </form>
                <br />
                {loginFormProvider === "internal" ? (
                    <>
                        <h2>Forgot your password?</h2>
                        <p>
                            Forgot your password?{" "}
                            {config.defaultContactEmail ? (
                                <>
                                    Email{" "}
                                    <CommonLink
                                        href={`mailto:${config.defaultContactEmail}`}
                                    >
                                        {config.defaultContactEmail}
                                    </CommonLink>
                                </>
                            ) : (
                                "Contact your administrator."
                            )}
                        </p>
                    </>
                ) : (
                    <>
                        <h2>Register</h2>
                        <p>
                            To register a new data.gov.au account,{" "}
                            <CommonLink
                                className="au-cta-link"
                                href="https://data.gov.au/user/register"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                click here
                            </CommonLink>
                            .
                        </p>
                    </>
                )}
            </div>
        );
    };

    const loginFormProviderOptions = () => {
        if (!loginFormProvider || !providers?.length) {
            return null;
        }
        return (
            <>
                {providers.indexOf("internal") !== -1 ? (
                    <li className="login__provider">
                        <a onClick={() => setLoginFormProvider("internal")}>
                            <img
                                src={magdaLogo}
                                className="login__logo"
                                alt="logo"
                            />
                            Magda
                        </a>
                    </li>
                ) : null}
                {providers.indexOf("ckan") !== -1 ? (
                    <li className="login__provider">
                        <a onClick={() => setLoginFormProvider("ckan")}>
                            <img
                                src={ckanLogo}
                                className="login__logo"
                                alt="logo"
                            />
                            Data.gov.au / Ckan
                        </a>
                    </li>
                ) : null}
            </>
        );
    };

    return (
        <div className="row login__row">
            {props.signInError && (
                <div className="col-xs-12">
                    <div className="au-body au-page-alerts au-page-alerts--error">
                        <p>Sign In Failed: {props.signInError} </p>
                    </div>
                </div>
            )}
            {isProvidersLoading ? (
                <div className="col-xs-12">
                    <p>Loading available authentication providers...</p>
                </div>
            ) : null}
            {!isProvidersLoading && providersLoadingError ? (
                <div className="col-xs-12">
                    <div className="au-body au-page-alerts au-page-alerts--error">
                        <p>
                            Failed to load authentication providers:{" "}
                            {"" + providersLoadingError}{" "}
                        </p>
                    </div>
                </div>
            ) : null}
            {!isProvidersLoading ? (
                <div className="col-sm-6 col-md-5">
                    <h2>Sign In / Register Providers</h2>
                    <ul className="login__providers">
                        {loginFormProviderOptions()}
                        {providers?.indexOf("facebook") !== -1 && (
                            <li className="login__provider">
                                <CommonLink href={makeLoginUrl("facebook")}>
                                    <img
                                        src={fbLogo}
                                        className="login__logo"
                                        alt="logo"
                                    />
                                    Facebook
                                </CommonLink>
                            </li>
                        )}
                        {providers?.indexOf("google") !== -1 && (
                            <li className="login__provider">
                                <CommonLink href={makeLoginUrl("google")}>
                                    <img
                                        src={googleLogo}
                                        className="login__logo"
                                        alt="logo"
                                    />
                                    Google
                                </CommonLink>
                            </li>
                        )}
                        {providers?.indexOf("arcgis") !== -1 && (
                            <li className="login__provider">
                                <CommonLink href={makeLoginUrl("arcgis")}>
                                    <img
                                        src={arcgisLogo}
                                        className="login__logo"
                                        alt="logo"
                                    />
                                    Esri
                                </CommonLink>
                            </li>
                        )}
                        {providers?.indexOf("aaf") !== -1 && (
                            <li className="login__provider">
                                <CommonLink href={makeLoginUrl("aaf")}>
                                    <img
                                        src={aafLogo}
                                        className="login__logo"
                                        alt="logo"
                                    />
                                    AAF
                                </CommonLink>
                            </li>
                        )}
                        {providers?.indexOf("vanguard") !== -1 && (
                            <li className="login__provider">
                                <CommonLink href={makeLoginUrl("vanguard")}>
                                    <img
                                        src={aafLogo}
                                        className="login__logo"
                                        alt="logo"
                                    />
                                    Vanguard
                                </CommonLink>
                            </li>
                        )}
                    </ul>
                </div>
            ) : null}
            {createLoginForm()}
        </div>
    );
}
