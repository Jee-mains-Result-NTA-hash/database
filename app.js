import {
    db,
    auth
} from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


/* =========================================================
   CONFIGURATION
========================================================= */

const ADMIN_EMAIL = "admin@matrixedu.in";


/* =========================================================
   DOM REFERENCES
========================================================= */

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

const toast =
    document.getElementById("toast");

const toastTitle =
    document.getElementById("toast-title");

const toastMessage =
    document.getElementById("toast-message");

const logoutButton =
    document.querySelector(".logout-button");


/* =========================================================
   INITIAL VISIBILITY
========================================================= */

if (authScreen) {
    authScreen.classList.remove("hidden");
}

if (appShell) {
    appShell.style.display = "none";
}


/* =========================================================
   LOGIN HELPERS
========================================================= */

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


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        hideLoginError();

        const email =
            loginEmail
                ? loginEmail.value.trim().toLowerCase()
                : "";

        const password =
            loginPassword
                ? loginPassword.value
                : "";

        if (!email || !password) {
            showLoginError(
                "Please enter your email and password."
            );
            return;
        }

        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = "Signing in...";
        }

        try {
            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                credential.user;

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

            showAdminApp();

            await initializeAdminDashboard();

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

                case "auth/network-request-failed":
                    message =
                        "Network error. Check your internet connection.";
                    break;

                case "auth/too-many-requests":
                    message =
                        "Too many attempts. Please try again later.";
                    break;

                default:
                    if (error.message) {
                        console.error(error.message);
                    }
                    break;
            }

            showLoginError(message);

        } finally {
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = "Sign In";
            }
        }
    });
}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showLoginScreen();
        return;
    }

    if (
        !user.email ||
        user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
    ) {
        try {
            await signOut(auth);
        } catch (error) {
            console.error(
                "Unauthorized sign-out error:",
                error
            );
        }

        showLoginScreen();

        showLoginError(
            "This account does not have Admin access."
        );

        return;
    }

    showAdminApp();

    await initializeAdminDashboard();
});


/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);

            showLoginScreen();

            if (loginPassword) {
                loginPassword.value = "";
            }

            hideLoginError();

        } catch (error) {
            console.error(
                "Logout error:",
                error
            );

            showToast(
                "Logout Failed",
                "Unable to sign out right now."
            );
        }
    });
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(title, message) {
    if (!toast || !toastTitle || !toastMessage) {
        return;
    }

    clearTimeout(toastTimer);

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
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

    pagesElements.forEach((page) => {
        page.classList.remove("active");
    });

    const targetPage =
        document.getElementById(
            `page-${pageName}`
        );

    if (targetPage) {
        targetPage.classList.add("active");
    }

    navItems.forEach((item) => {
        item.classList.remove("active");

        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }
    });

    if (pageTitle) {
        pageTitle.textContent =
            pages[pageName].title;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent =
            pages[pageName].subtitle;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ---------------------------------------------------------
   SIDEBAR
--------------------------------------------------------- */

navItems.forEach((item) => {
    item.addEventListener("click", () => {
        openPage(item.dataset.page);
    });
});


/* ---------------------------------------------------------
   QUICK ACTIONS
--------------------------------------------------------- */

quickActions.forEach((button) => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});


/* =========================================================
   FIRESTORE TEST
========================================================= */

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
            "Firebase connected successfully."
        );

        console.log(
            "Notifications found:",
            snapshot.size
        );

        return true;

    } catch (error) {
        console.error(
            "Firestore connection failed:",
            error
        );

        return false;
    }
}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

async function loadDashboardStats() {
    try {
        const [
            studentsSnapshot,
            testsSnapshot,
            notificationsSnapshot
        ] = await Promise.all([
            getDocs(
                collection(
                    db,
                    "students"
                )
            ),

            getDocs(
                collection(
                    db,
                    "tests"
                )
            ),

            getDocs(
                collection(
                    db,
                    "notifications"
                )
            )
        ]);

        const statCards =
            document.querySelectorAll(
                ".stat-card"
            );

        if (statCards.length >= 4) {
            const values = [
                studentsSnapshot.size,
                testsSnapshot.size,
                notificationsSnapshot.size,
                testsSnapshot.size
            ];

            values.forEach((value, index) => {
                const valueElement =
                    statCards[index]
                        ? statCards[index]
                            .querySelector(".stat-value")
                        : null;

                if (valueElement) {
                    valueElement.textContent =
                        value;
                }
            });
        }

    } catch (error) {
        console.error(
            "Unable to load dashboard statistics:",
            error
        );
    }
}


/* =========================================================
   ADMIN DASHBOARD INITIALIZATION
========================================================= */

let dashboardInitialized = false;

async function initializeAdminDashboard() {
    if (dashboardInitialized) {
        return;
    }

    dashboardInitialized = true;

    openPage("home");

    await testFirebaseConnection();

    await loadDashboardStats();

    updateNotificationPreview();
}


/* =========================================================
   RESULT FORM
========================================================= */

const resultFieldIds = [
    "test-title",
    "start-date",
    "start-time",
    "end-date",
    "end-time",
    "result-date",
    "status",
    "rank",
    "total-score",
    "attempted",
    "incorrect",
    "highest-marks",
    "topper-attempted",
    "maths-marks",
    "maths-highest",
    "maths-average",
    "maths-top25",
    "physics-marks",
    "physics-highest",
    "physics-average",
    "physics-top25",
    "chemistry-marks",
    "chemistry-highest",
    "chemistry-average",
    "chemistry-top25"
];


function getElementValue(id) {
    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : "";
}


function getNumberValue(id) {
    const value =
        getElementValue(id);

    if (value === "") {
        return null;
    }

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}


function clearResultForm() {
    resultFieldIds.forEach((id) => {
        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        if (element.tagName === "SELECT") {
            element.selectedIndex = 0;
        } else {
            element.value = "";
        }
    });
}


const clearResultButton =
    document.getElementById(
        "clear-result"
    );

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


/* =========================================================
   RESULT VALIDATION
========================================================= */

function validateResultForm() {
    const requiredTextFields = [
        ["test-title", "Test title"],
        ["start-date", "Start date"],
        ["start-time", "Start time"],
        ["end-date", "End date"],
        ["end-time", "End time"],
        ["result-date", "Result date"]
    ];

    for (const [id, label] of requiredTextFields) {
        if (!getElementValue(id)) {
            showToast(
                "Missing Information",
                `Please enter ${label}.`
            );

            const input =
                document.getElementById(id);

            if (input) {
                input.focus();
            }

            return false;
        }
    }

    const numericFields = [
        ["rank", "Rank"],
        ["total-score", "Total score"],
        ["attempted", "Attempted questions"],
        ["incorrect", "Incorrect questions"],
        ["highest-marks", "Highest marks"],
        ["topper-attempted", "Topper attempted questions"],

        ["maths-marks", "Mathematics marks"],
        ["maths-highest", "Mathematics highest marks"],
        ["maths-average", "Mathematics average"],
        ["maths-top25", "Mathematics top 25 average"],

        ["physics-marks", "Physics marks"],
        ["physics-highest", "Physics highest marks"],
        ["physics-average", "Physics average"],
        ["physics-top25", "Physics top 25 average"],

        ["chemistry-marks", "Chemistry marks"],
        ["chemistry-highest", "Chemistry highest marks"],
        ["chemistry-average", "Chemistry average"],
        ["chemistry-top25", "Chemistry top 25 average"]
    ];

    for (const [id, label] of numericFields) {
        const value =
            getNumberValue(id);

        if (value === null) {
            showToast(
                "Missing Information",
                `Please enter ${label}.`
            );

            const input =
                document.getElementById(id);

            if (input) {
                input.focus();
            }

            return false;
        }
    }

    const startDate =
        getElementValue("start-date");

    const startTime =
        getElementValue("start-time");

    const endDate =
        getElementValue("end-date");

    const endTime =
        getElementValue("end-time");

    const startDateTime =
        new Date(
            `${startDate}T${startTime}`
        );

    const endDateTime =
        new Date(
            `${endDate}T${endTime}`
        );

    if (
        Number.isNaN(startDateTime.getTime()) ||
        Number.isNaN(endDateTime.getTime())
    ) {
        showToast(
            "Invalid Date",
            "Please check the start and end date/time."
        );

        return false;
    }

    if (endDateTime <= startDateTime) {
        showToast(
            "Invalid Schedule",
            "End date/time must be after the start date/time."
        );

        return false;
    }

    return true;
}


/* =========================================================
   RESULT DATE FORMATTER
========================================================= */

function formatResultDate(dateValue) {
    const date =
        new Date(
            `${dateValue}T00:00:00`
        );

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   SAVE RESULT
========================================================= */

const saveResultButton =
    document.getElementById(
        "save-result"
    );

if (saveResultButton) {
    saveResultButton.addEventListener(
        "click",
        async () => {

            if (!validateResultForm()) {
                return;
            }

            saveResultButton.disabled = true;
            saveResultButton.textContent = "Saving...";

            try {
                const title =
                    getElementValue(
                        "test-title"
                    );

                const startDate =
                    getElementValue(
                        "start-date"
                    );

                const startTime =
                    getElementValue(
                        "start-time"
                    );

                const endDate =
                    getElementValue(
                        "end-date"
                    );

                const endTime =
                    getElementValue(
                        "end-time"
                    );

                const resultDate =
                    getElementValue(
                        "result-date"
                    );

                const startDateTime =
                    new Date(
                        `${startDate}T${startTime}`
                    );

                const endDateTime =
                    new Date(
                        `${endDate}T${endTime}`
                    );

                const status =
                    getElementValue("status") ||
                    "past";

                const testData = {
                    title,

                    duration: "180 Mins",

                    mode: "online + offline",

                    questionCount:
                        getNumberValue(
                            "topper-attempted"
                        ),

                    start:
                        Timestamp.fromDate(
                            startDateTime
                        ),

                    end:
                        Timestamp.fromDate(
                            endDateTime
                        ),

                    resultDate:
                        formatResultDate(
                            resultDate
                        ),

                    status,

                    result: {
                        attempted_question_topper:
                            getNumberValue(
                                "topper-attempted"
                            ),

                        attempted_question_you:
                            getNumberValue(
                                "attempted"
                            ),

                        average_chemistry:
                            getNumberValue(
                                "chemistry-average"
                            ),

                        average_maths:
                            getNumberValue(
                                "maths-average"
                            ),

                        average_physics:
                            getNumberValue(
                                "physics-average"
                            ),

                        average_total:
                            getNumberValue(
                                "maths-average"
                            ) +
                            getNumberValue(
                                "physics-average"
                            ) +
                            getNumberValue(
                                "chemistry-average"
                            ),

                        chemistry_mark_highest:
                            getNumberValue(
                                "chemistry-highest"
                            ),

                        chemistry_marks:
                            getNumberValue(
                                "chemistry-marks"
                            ),

                        highest_marks:
                            getNumberValue(
                                "highest-marks"
                            ),

                        incorrect_questions:
                            getNumberValue(
                                "incorrect"
                            ),

                        maths_marks:
                            getNumberValue(
                                "maths-marks"
                            ),

                        maths_marks_highest:
                            getNumberValue(
                                "maths-highest"
                            ),

                        physics_mark_highest:
                            getNumberValue(
                                "physics-highest"
                            ),

                        physics_marks:
                            getNumberValue(
                                "physics-marks"
                            ),

                        rank:
                            getNumberValue(
                                "rank"
                            ),

                        top25_average_chemistry:
                            getNumberValue(
                                "chemistry-top25"
                            ),

                        top25_average_maths:
                            getNumberValue(
                                "maths-top25"
                            ),

                        top25_average_physics:
                            getNumberValue(
                                "physics-top25"
                            ),

                        top25_average_total:
                            getNumberValue(
                                "maths-top25"
                            ) +
                            getNumberValue(
                                "physics-top25"
                            ) +
                            getNumberValue(
                                "chemistry-top25"
                            ),

                        total_score:
                            getNumberValue(
                                "total-score"
                            ),

                        total_students: 1825
                    }
                };

                const documentReference =
                    await addDoc(
                        collection(
                            db,
                            "tests"
                        ),
                        testData
                    );

                console.log(
                    "Result saved:",
                    documentReference.id
                );

                showToast(
                    "Result Saved",
                    "The test result has been added to Firestore successfully."
                );

                clearResultForm();

                await loadDashboardStats();

            } catch (error) {
                console.error(
                    "Failed to save result:",
                    error
                );

                if (
                    error.code ===
                    "permission-denied"
                ) {
                    showToast(
                        "Permission Denied",
                        "Firestore rejected this admin write. Check your Firestore Security Rules."
                    );
                } else {
                    showToast(
                        "Save Failed",
                        "The result could not be saved. Check the browser console for details."
                    );
                }

            } finally {
                saveResultButton.disabled = false;
                saveResultButton.textContent =
                    "Save Result";
            }
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


/* =========================================================
   CLEAR NOTIFICATION
========================================================= */

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


/* =========================================================
   PUBLISH NOTIFICATION
========================================================= */

const publishNotificationButton =
    document.getElementById(
        "publish-notification"
    );

if (publishNotificationButton) {
    publishNotificationButton.addEventListener(
        "click",
        async () => {

            const title =
                notificationTitleInput
                    ? notificationTitleInput.value.trim()
                    : "";

            const message =
                notificationMessageInput
                    ? notificationMessageInput.value.trim()
                    : "";

            const typeElement =
                document.getElementById(
                    "notification-type"
                );

            const dateElement =
                document.getElementById(
                    "notification-date"
                );

            const timeElement =
                document.getElementById(
                    "notification-time"
                );

            const type =
                typeElement
                    ? typeElement.value
                    : "announcement";

            const date =
                dateElement
                    ? dateElement.value
                    : "";

            const time =
                timeElement
                    ? timeElement.value
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

            if (!date) {
                showToast(
                    "Missing Date",
                    "Please select a notification date."
                );

                if (dateElement) {
                    dateElement.focus();
                }

                return;
            }

            if (!time) {
                showToast(
                    "Missing Time",
                    "Please select a notification time."
                );

                if (timeElement) {
                    timeElement.focus();
                }

                return;
            }

            const notificationDateTime =
                new Date(
                    `${date}T${time}`
                );

            if (
                Number.isNaN(
                    notificationDateTime.getTime()
                )
            ) {
                showToast(
                    "Invalid Date",
                    "Please check the notification date and time."
                );

                return;
            }

            publishNotificationButton.disabled = true;
            publishNotificationButton.textContent =
                "Publishing...";

            try {

                const notificationData = {
                    title,
                    message,
                    type,

                    timestamp:
                        Timestamp.fromDate(
                            notificationDateTime
                        ),

                    isRead: false
                };

                const documentReference =
                    await addDoc(
                        collection(
                            db,
                            "notifications"
                        ),
                        notificationData
                    );

                console.log(
                    "Notification published:",
                    documentReference.id
                );

                showToast(
                    "Notification Published",
                    "The notification is now stored in Firestore."
                );

                if (notificationTitleInput) {
                    notificationTitleInput.value = "";
                }

                if (notificationMessageInput) {
                    notificationMessageInput.value = "";
                }

                if (typeElement) {
                    typeElement.selectedIndex = 0;
                }

                if (dateElement) {
                    dateElement.value = "";
                }

                if (timeElement) {
                    timeElement.value = "";
                }

                updateNotificationPreview();

                await loadDashboardStats();

            } catch (error) {
                console.error(
                    "Failed to publish notification:",
                    error
                );

                if (
                    error.code ===
                    "permission-denied"
                ) {
                    showToast(
                        "Permission Denied",
                        "Firestore rejected this admin write. Check your Firestore Security Rules."
                    );
                } else {
                    showToast(
                        "Publish Failed",
                        "The notification could not be published. Check the browser console."
                    );
                }

            } finally {
                publishNotificationButton.disabled = false;
                publishNotificationButton.textContent =
                    "Publish Notification";
            }
        }
    );
}


/* =========================================================
   INITIAL PAGE
========================================================= */

openPage("home");
updateNotificationPreview();
