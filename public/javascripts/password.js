$(document).ready(() => {

    let passwordInput = $('#password')
    $('#eye').on('click', () => {
        if (passwordInput.hasClass('show-password')) {
            passwordInput.attr('type', 'password')
            passwordInput.addClass('hide-password')
            passwordInput.removeClass('show-password')
        } else {
            passwordInput.attr('type', 'text')
            passwordInput.removeClass('hide-password')
            passwordInput.addClass('show-password')
        }
    })
})

const togglePassword = () => {
    let changePasswordDiv = $('#change-password')
    let toggleButton = $('#toggleButton')
    if (changePasswordDiv.hasClass('show-password-change')) {
        changePasswordDiv.removeClass('show-password-change')
        toggleButton.html('Promjeni lozinku')
    }
    else {
        changePasswordDiv.addClass('show-password-change')
        toggleButton.html('Odustani')
    }
}

const passwordRegex = new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/)
const isPasswordValid = password => passwordRegex.test(password)