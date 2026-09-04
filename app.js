import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


/* =========================================================
   FIREBASE / ADMIN AUTHENTICATION
========================================================= */

const ADMIN_EMAIL = "admin@matrixedu.in";

const authScreen =
    document.getElementById("auth-screen");

const appShell =
    document.querySelector(".app-shell");

const loginForm =
    document.getElementById("login-form");

const loginEmail =
    document.getElementById("login-email");

const loginPassword =
    document.getElementById("login-password");

const loginButton =
    document.getElementById("login-button");

const loginError =
    document.getElementById("login-error");


/*
 * Keep the actual admin dashboard hidden until
 * Firebase confirms that a valid admin is signed in.
 */
if (appShell) {
    appShell.style.display = "none";
}


/* ---------------------------------------------------------
   LOGIN ERROR
--------------------------------------------------------- */

function showLoginError(message) {

    if (!loginError) {
        return;
    }

    loginError.textContent = message;
    loginError.classList.add("show");
}


function hideLoginError() {

    if (!loginError) {
        return;
    }

    loginError.textContent = "";
    loginError.classList.remove("show");
}


/* ---------------------------------------------------------
   SHOW / HIDE APP
--------------------------------------------------------- */

function showAdminApp() {

    if (authScreen) {
        authScreen.classList.add("hidden");
    }

    if (appShell) {
        appShell.style.display = "flex";
    }
}


function showLoginScreen() {

    if (authScreen) {
        authScreen.classList.remove("hidden");
    }

    if (appShell) {
        appShell.style.display = "none";
    }
}


/* ---------------------------------------------------------
   LOGIN
--------------------------------------------------------- */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideLoginError();


            const email =
                loginEmail.value.trim().toLowerCase();

            const password =
                loginPassword.value;


            if (!email || !password) {

                showLoginError(
                    "Please enter your email and password."
                );

                return;
            }


            loginButton.disabled = true;
            loginButton.textContent = "Signing in...";


            try {

                /*
                 * Firebase Authentication
                 */
                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                /*
                 * Admin email check
                 */
                if (
                    !user.email ||
                    user.email.toLowerCase() !==
                    ADMIN_EMAIL.toLowerCase()
                ) {

                    await signOut(auth);

                    showLoginError(
                        "This account does not have Admin access."
                    );

                    return;
                }


                console.log(
                    "✅ Admin authenticated:",
                    user.email
                );


                showAdminApp();


                /*
                 * Test Firestore after successful authentication.
                 */
                await testFirebaseConnection();

            } catch (error) {

                console.error(
                    "Firebase login error:",
                    error
                );


                let message =
                    "Unable to sign in. Please check your credentials.";


                switch (error.code) {

                    case "auth/invalid-credential":
                        message =
                            "Incorrect email or password.";
                        break;


                    case "auth/invalid-email":
                        message =
                            "Please enter a valid email address.";
                        break;


                    case "auth/user-not-found":
                        message =
                            "No account exists with this email.";
                        break;


                    case "auth/wrong-password":
                        message =
                            "Incorrect password.";
                        break;


                    case "auth/too-many-requests":
                        message =
                            "Too many login attempts. Please try again later.";
                        break;


                    case "auth/network-request-failed":
                        message =
                            "Network error. Please check your internet connection.";
                        break;


                    case "auth/user-disabled":
                        message =
                            "This account has been disabled.";
                        break;

                }


                showLoginError(message);

            } finally {

                loginButton.disabled = false;
                loginButton.textContent = "Sign In";

            }

        }
    );

}


/* ---------------------------------------------------------
   AUTH STATE
--------------------------------------------------------- */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            showLoginScreen();

            return;
        }


        /*
         * Only the designated admin email is allowed
         * to remain signed in to this dashboard.
         */
        if (
            !user.email ||
            user.email.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            try {

                await signOut(auth);

            } catch (error) {

                console.error(
                    "Failed to sign out unauthorized user:",
                    error
                );

            }


            showLoginScreen();

            showLoginError(
                "This account does not have Admin access."
            );

            return;
        }


        console.log(
            "✅ Existing admin session:",
            user.email
        );


        showAdminApp();


        /*
         * Verify Firestore access now that authentication
         * has been confirmed.
         */
        await testFirebaseConnection();

    }
);


/* ---------------------------------------------------------
   FIRESTORE CONNECTION TEST
--------------------------------------------------------- */

async function testFirebaseConnection() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "notifications"
                )
            );


        console.log(
            "✅ Firestore connected successfully."
        );


        console.log(
            "Notifications found:",
            snapshot.size
        );


    } catch (error) {

        console.error(
            "❌ Firestore connection failed:",
            error
        );

    }

}


/* ---------------------------------------------------------
   LOGOUT
--------------------------------------------------------- */

const logoutButton =
    document.querySelector(".logout-button");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                console.log(
                    "✅ Admin signed out."
                );

            } catch (error) {

                console.error(
                    "Logout failed:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

const pages = {

    home: {
        title: "Dashboard",
        subtitle:
            "Matrix administration and control center"
    },

    result: {
        title: "Add Result",
        subtitle:
            "Create and manage test result records"
    },

    notification: {
        title: "Add Notification",
        subtitle:
            "Publish notifications to Matrix students"
    }

};


const navItems =
    document.querySelectorAll(".nav-item");

const quickActions =
    document.querySelectorAll(".quick-action");

const pagesElements =
    document.querySelectorAll(".page");


const pageTitle =
    document.getElementById("page-title");

const pageSubtitle =
    document.getElementById("page-subtitle");


function openPage(pageName) {

    if (!pages[pageName]) {
        return;
    }


    /*
     * Hide all pages
     */
    pagesElements.forEach(
        (page) => {
            page.classList.remove("active");
        }
    );


    /*
     * Show requested page
     */
    const targetPage =
        document.getElementById(
            `page-${pageName}`
        );


    if (targetPage) {

        targetPage.classList.add("active");

    }


    /*
     * Update sidebar active state
     */
    navItems.forEach(
        (item) => {

            item.classList.remove("active");


            if (
                item.dataset.page === pageName
            ) {

                item.classList.add("active");

            }

        }
    );


    /*
     * Update topbar
     */
    if (pageTitle) {

        pageTitle.textContent =
            pages[pageName].title;

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            pages[pageName].subtitle;

    }


    /*
     * Scroll to top
     */
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ---------------------------------------------------------
   SIDEBAR NAVIGATION
--------------------------------------------------------- */

navItems.forEach(
    (item) => {

        item.addEventListener(
            "click",
            () => {

                openPage(
                    item.dataset.page
                );

            }
        );

    }
);


/* ---------------------------------------------------------
   QUICK ACTIONS
--------------------------------------------------------- */

quickActions.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                openPage(
                    button.dataset.page
                );

            }
        );

    }
);


/* =========================================================
   TOAST
========================================================= */

const toast =
    document.getElementById("toast");

const toastTitle =
    document.getElementById("toast-title");

const toastMessage =
    document.getElementById("toast-message");


let toastTimer;


function showToast(title, message) {

    if (
        !toast ||
        !toastTitle ||
        !toastMessage
    ) {
        return;
    }


    clearTimeout(toastTimer);


    toastTitle.textContent =
        title;

    toastMessage.textContent =
        message;


    toast.classList.add("show");


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   RESULT FORM
========================================================= */

const saveResultButton =
    document.getElementById("save-result");

const clearResultButton =
    document.getElementById("clear-result");


function clearResultForm() {

    const resultSection =
        document.getElementById(
            "page-result"
        );


    if (!resultSection) {
        return;
    }


    const inputs =
        resultSection.querySelectorAll(
            "input"
        );


    inputs.forEach(
        (input) => {

            input.value = "";

        }
    );


    const selects =
        resultSection.querySelectorAll(
            "select"
        );


    selects.forEach(
        (select) => {

            select.selectedIndex = 0;

        }
    );

}


if (clearResultButton) {

    clearResultButton.addEventListener(
        "click",
        () => {

            clearResultForm();


            showToast(
                "Form Cleared",
                "All result fields have been cleared."
            );

        }
    );

}


if (saveResultButton) {

    saveResultButton.addEventListener(
        "click",
        () => {

            const titleInput =
                document.getElementById(
                    "test-title"
                );


            const title =
                titleInput
                    ? titleInput.value.trim()
                    : "";


            if (!title) {

                showToast(
                    "Missing Information",
                    "Please enter a test title first."
                );


                if (titleInput) {

                    titleInput.focus();

                }


                return;
            }


            /*
             * Firebase Firestore result creation
             * will be connected here next.
             */


            showToast(
                "Ready to Save",
                "Result form is valid. Firebase saving will be connected next."
            );

        }
    );

}


/* =========================================================
   NOTIFICATION FORM
========================================================= */

const notificationTitleInput =
    document.getElementById(
        "notification-title"
    );


const notificationMessageInput =
    document.getElementById(
        "notification-message"
    );


const previewTitle =
    document.getElementById(
        "preview-title"
    );


const previewMessage =
    document.getElementById(
        "preview-message"
    );


function updateNotificationPreview() {

    if (
        !notificationTitleInput ||
        !notificationMessageInput ||
        !previewTitle ||
        !previewMessage
    ) {
        return;
    }


    const title =
        notificationTitleInput.value.trim();


    const message =
        notificationMessageInput.value.trim();


    previewTitle.textContent =
        title ||
        "Notification title";


    previewMessage.textContent =
        message ||
        "Your notification preview will appear here.";

}


if (notificationTitleInput) {

    notificationTitleInput.addEventListener(
        "input",
        updateNotificationPreview
    );

}


if (notificationMessageInput) {

    notificationMessageInput.addEventListener(
        "input",
        updateNotificationPreview
    );


}


const clearNotificationButton =
    document.getElementById(
        "clear-notification"
    );


if (clearNotificationButton) {

    clearNotificationButton.addEventListener(
        "click",
        () => {

            if (notificationTitleInput) {
                notificationTitleInput.value = "";
            }


            if (notificationMessageInput) {
                notificationMessageInput.value = "";
            }


            const notificationType =
                document.getElementById(
                    "notification-type"
                );


            if (notificationType) {
                notificationType.selectedIndex = 0;
            }


            const notificationDate =
                document.getElementById(
                    "notification-date"
                );


            if (notificationDate) {
                notificationDate.value = "";
            }


            const notificationTime =
                document.getElementById(
                    "notification-time"
                );


            if (notificationTime) {
                notificationTime.value = "";
            }


            updateNotificationPreview();


            showToast(
                "Form Cleared",
                "Notification fields have been cleared."
            );

        }
    );

}


/* ---------------------------------------------------------
   PUBLISH NOTIFICATION
--------------------------------------------------------- */

const publishNotificationButton =
    document.getElementById(
        "publish-notification"
    );


if (publishNotificationButton) {

    publishNotificationButton.addEventListener(
        "click",
        () => {

            const title =
                notificationTitleInput
                    ? notificationTitleInput.value.trim()
                    : "";


            const message =
                notificationMessageInput
                    ? notificationMessageInput.value.trim()
                    : "";


            if (!title) {

                showToast(
                    "Missing Title",
                    "Please enter a notification title."
                );


                if (notificationTitleInput) {

                    notificationTitleInput.focus();

                }


                return;
            }


            if (!message) {

                showToast(
                    "Missing Message",
                    "Please enter a notification message."
                );


                if (notificationMessageInput) {

                    notificationMessageInput.focus();

                }


                return;
            }


            /*
             * Firebase Firestore notification creation
             * will be connected here next.
             */


            showToast(
                "Ready to Publish",
                "Notification form is valid. Firebase publishing will be connected next."
            );

        }
    );

}


/* =========================================================
   INITIAL STATE
========================================================= */

openPage("home");
