document.addEventListener('DOMContentLoaded', async () => {
    const page = document.querySelector('.user-admin');
    const list = document.querySelector('#user-list');
    const status = document.querySelector('#user-admin-status');
    const isAdmin = page.dataset.isAdmin === 'true';

    const setStatus = (message, isError = false) => {
        status.textContent = message;
        status.classList.toggle('user-admin__status--error', isError);
    };

    const getRoleName = (user) =>
        typeof user.role === 'object' ? user.role.name : user.role;

    const createInput = (labelText, value, name, type = 'text') => {
        const label = document.createElement('label');
        label.className = 'user-admin__field';
        label.textContent = labelText;

        const input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.value = value || '';
        input.required = true;
        label.append(input);
        return label;
    };

    const createUserForm = (user) => {
        const form = document.createElement('form');
        form.className = 'user-admin__card';
        form.dataset.userId = user._id;
        form.append(createInput('Display name', user.displayName, 'displayName'));
        form.append(createInput('Username', user.username, 'username'));
        form.append(createInput('Email', user.email, 'email', 'email'));

        if (isAdmin) {
            const roleLabel = createInput('Role', getRoleName(user), 'role');
            roleLabel.querySelector('input').setAttribute('list', 'user-roles');
            form.append(roleLabel);
        }

        const actions = document.createElement('div');
        actions.className = 'user-admin__actions';

        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.textContent = 'Save changes';
        actions.append(saveButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'user-admin__delete';
        deleteButton.textContent = 'Delete user';
        deleteButton.addEventListener('click', async () => {
            if (!window.confirm(`Delete ${user.displayName}?`)) {
                return;
            }

            await mutateUser(user._id, 'DELETE');
        });
        actions.append(deleteButton);
        form.append(actions);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const body = Object.fromEntries(formData.entries());
            await mutateUser(user._id, 'PUT', body);
        });

        return form;
    };

    const renderUsers = (users) => {
        list.replaceChildren();
        if (users.length === 0) {
            setStatus('No users found.');
            return;
        }

        const fragment = document.createDocumentFragment();
        users.forEach((user) => fragment.append(createUserForm(user)));
        list.append(fragment);
        setStatus(`${users.length} user${users.length === 1 ? '' : 's'} loaded.`);
    };

    const loadUsers = async () => {
        const response = await fetch('/api/users');
        if (response.status === 401) {
            window.location.href = '/auth/login';
            return;
        }
        if (!response.ok) {
            let message = `Unable to load users (${response.status}).`;
            try {
                const result = await response.json();
                message = result.error || result.message || message;
            } catch (error) {
                console.error('Unable to read user API error:', error);
            }
            throw new Error(message);
        }
        renderUsers(await response.json());
    };

    const mutateUser = async (id, method, body) => {
        setStatus('Saving changes...');
        const response = await fetch(`/api/users/${id}`, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.status === 401) {
            window.location.href = '/auth/login';
            return;
        }
        if (!response.ok) {
            const result = await response.json();
            setStatus(result.error || 'Unable to save changes.', true);
            return;
        }

        await loadUsers();
    };

    const roles = document.createElement('datalist');
    roles.id = 'user-roles';
    ['user', 'admin'].forEach((role) => {
        const option = document.createElement('option');
        option.value = role;
        roles.append(option);
    });
    document.body.append(roles);

    try {
        await loadUsers();
    } catch (error) {
        console.error(error);
        setStatus(error.message, true);
    }
});
