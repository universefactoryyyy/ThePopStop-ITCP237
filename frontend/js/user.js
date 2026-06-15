

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

$(document).ready(function () {
    if ($('#loginForm').length) {
        $('#loginForm').on('submit', function (e) {
            e.preventDefault();
            const email = $('#email').val().trim();
            const password = $('#password').val();
            let valid = true;

            if (!email) { $('#emailError').text('Email is required.').show(); valid = false; }
            else if (!validateEmail(email)) { $('#emailError').text('Invalid email format.').show(); valid = false; }
            else { $('#emailError').hide(); }

            if (!password) { $('#passwordError').show(); valid = false; }
            else { $('#passwordError').hide(); }
            if (!valid) return;

            $.ajax({
                method: 'POST',
                url: `${window.API_URL}/api/v1/login`,
                contentType: 'application/json',
                data: JSON.stringify({ email, password }),
                success: function (data) {
                    sessionStorage.setItem('token', JSON.stringify(data.token));
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    Swal.fire({ icon: 'success', text: data.message, timer: 1500, showConfirmButton: false })
                        .then(() => window.location.href = 'index.html');
                },
                error: function (xhr) {
                    Swal.fire({ icon: 'error', text: xhr.responseJSON?.message || 'Login failed.' });
                }
            });
        });
    }

    if ($('#registerForm').length) {
        $('#avatar').on('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) { $('#avatarPreview').attr('src', e.target.result); };
                reader.readAsDataURL(file);
            }
        });

        $('#registerForm').on('submit', function (e) {
            e.preventDefault();
            const name = $('#name').val().trim();
            const email = $('#email').val().trim();
            const phone = $('#phone').val().trim();
            const addressline = $('#addressline').val().trim();
            const password = $('#password').val();
            const confirmPassword = $('#confirmPassword').val();
            let valid = true;

            if (!name) { $('#nameError').show(); valid = false; } else { $('#nameError').hide(); }
            if (!email) { $('#emailError').text('Email is required.').show(); valid = false; }
            else if (!validateEmail(email)) { $('#emailError').text('Invalid email format.').show(); valid = false; }
            else { $('#emailError').hide(); }
            if (!phone) { $('#phoneError').show(); valid = false; } else { $('#phoneError').hide(); }
            if (!addressline) { $('#addressError').show(); valid = false; } else { $('#addressError').hide(); }
            if (!password) { $('#passwordError').show(); valid = false; } else { $('#passwordError').hide(); }
            if (password !== confirmPassword) { $('#confirmError').show(); valid = false; } else { $('#confirmError').hide(); }
            if (!valid) return;

            const formData = new FormData(this);

            $.ajax({
                method: 'POST',
                url: `${API_URL}/api/v1/register`,
                data: formData,
                contentType: false,
                processData: false,
                success: function (data) {
                    Swal.fire({ icon: 'success', text: data.message })
                        .then(() => window.location.href = 'login.html');
                },
                error: function (xhr) {
                    Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Registration failed.' });
                }
            });
        });
    }

    if ($('#profileForm').length) {
        const token = sessionStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        const user = getUser();
        $('#userName').text(user.name);
        $('#userEmail').text(user.email);

        // Load user's current avatar
        if (user.avatar) {
            $('#avatarPreview').attr('src', API_URL + user.avatar);
        }

        $('#avatar').on('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) { $('#avatarPreview').attr('src', e.target.result); };
                reader.readAsDataURL(file);
            }
        });

        $('#profileForm').on('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('userId', user.id);

            $.ajax({
                method: 'PUT',
                url: `${window.API_URL}/api/v1/profile`,
                data: formData,
                contentType: false,
                processData: false,
                headers: { Authorization: 'Bearer ' + JSON.parse(token) },
                success: function (data) {
                    // Update user in sessionStorage
                    const updatedUser = { ...user, ...data.user };
                    sessionStorage.setItem('user', JSON.stringify(updatedUser));
                    Swal.fire({ icon: 'success', text: data.message, timer: 1500, showConfirmButton: false });
                },
                error: function (xhr) {
                    Swal.fire({ icon: 'error', text: xhr.responseJSON?.error || 'Update failed.' });
                }
            });
        });
    }
});
