/* =========================================================
   PAGE NAVIGATION
========================================================= */

const pages = {
    home: {
        title: "Dashboard",
        subtitle: "Matrix administration and control center"
    },

    result: {
        title: "Add Result",
        subtitle: "Create and manage test result records"
    },

    notification: {
        title: "Add Notification",
        subtitle: "Publish notifications to Matrix students"
    }
};


const navItems = document.querySelectorAll(".nav-item");
const quickActions = document.querySelectorAll(".quick-action");
const pagesElements = document.querySelectorAll(".page");

const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");


function openPage(pageName) {

    if (!pages[pageName]) {
        return;
    }


    pagesElements.forEach((page) => {
        page.classList.remove("active");
    });


    const targetPage =
        document.getElementById(`page-${pageName}`);


    if (targetPage) {
        targetPage.classList.add("active");
    }


    navItems.forEach((item) => {

        item.classList.remove("active");

        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }

    });


    pageTitle.textContent =
        pages[pageName].title;

    pageSubtitle.textContent =
        pages[pageName].subtitle;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* SIDEBAR NAVIGATION */

navItems.forEach((item) => {

    item.addEventListener("click", () => {

        openPage(item.dataset.page);

    });

});


/* QUICK ACTIONS */

quickActions.forEach((button) => {

    button.addEventListener("click", () => {

        openPage(button.dataset.page);

    });

});


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

    clearTimeout(toastTimer);


    toastTitle.textContent = title;

    toastMessage.textContent = message;


    toast.classList.add("show");


    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
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
        document.getElementById("page-result");


    const inputs =
        resultSection.querySelectorAll(
            "input"
        );


    inputs.forEach((input) => {

        input.value = "";

    });


    const selects =
        resultSection.querySelectorAll(
            "select"
        );


    selects.forEach((select) => {

        select.selectedIndex = 0;

    });

}


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


saveResultButton.addEventListener(
    "click",
    () => {

        const title =
            document.getElementById(
                "test-title"
            ).value.trim();


        if (!title) {

            showToast(
                "Missing Information",
                "Please enter a test title first."
            );

            document.getElementById(
                "test-title"
            ).focus();

            return;
        }


        /*
         * Firebase Firestore integration will be
         * added here in the next stage.
         */

        showToast(
            "Ready to Save",
            "Result form is valid. Firebase saving will be connected next."
        );

    }
);


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

    const title =
        notificationTitleInput.value.trim();


    const message =
        notificationMessageInput.value.trim();


    previewTitle.textContent =
        title || "Notification title";


    previewMessage.textContent =
        message ||
        "Your notification preview will appear here.";

}


notificationTitleInput.addEventListener(
    "input",
    updateNotificationPreview
);


notificationMessageInput.addEventListener(
    "input",
    updateNotificationPreview
);


const clearNotificationButton =
    document.getElementById(
        "clear-notification"
    );


clearNotificationButton.addEventListener(
    "click",
    () => {

        notificationTitleInput.value = "";

        notificationMessageInput.value = "";

        document.getElementById(
            "notification-type"
        ).selectedIndex = 0;


        document.getElementById(
            "notification-date"
        ).value = "";


        document.getElementById(
            "notification-time"
        ).value = "";


        updateNotificationPreview();


        showToast(
            "Form Cleared",
            "Notification fields have been cleared."
        );

    }
);


const publishNotificationButton =
    document.getElementById(
        "publish-notification"
    );


publishNotificationButton.addEventListener(
    "click",
    () => {

        const title =
            notificationTitleInput.value.trim();


        const message =
            notificationMessageInput.value.trim();


        if (!title) {

            showToast(
                "Missing Title",
                "Please enter a notification title."
            );

            notificationTitleInput.focus();

            return;
        }


        if (!message) {

            showToast(
                "Missing Message",
                "Please enter a notification message."
            );

            notificationMessageInput.focus();

            return;
        }


        /*
         * Firebase Firestore integration will be
         * added here in the next stage.
         */

        showToast(
            "Ready to Publish",
            "Notification form is valid. Firebase publishing will be connected next."
        );

    }
);


/* =========================================================
   DEFAULT STATE
========================================================= */

openPage("home");
