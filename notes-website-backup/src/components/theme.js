export const applyLightTheme = () => {
    document.body.style.backgroundColor = "#ffffff";
    document.body.style.color = "#000000";
};

export const applyDarkTheme = () => {
    document.body.style.backgroundColor = "#000000";
    document.body.style.color = "#ffffff";
};

export const toggleTheme = (isDarkMode) => {
    if (isDarkMode) {
        applyDarkTheme();
    } else {
        applyLightTheme();
    }
};