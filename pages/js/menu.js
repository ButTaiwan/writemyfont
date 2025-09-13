function initMenu() {
    // 上方選單切換
    const menuPages = document.querySelectorAll('#menu>div');
    document.querySelectorAll('.nav-link').forEach((link, index) => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            menuPages.forEach(l => l.classList.remove('active'));
            menuPages[index].classList.add('active');
        });
    });
}