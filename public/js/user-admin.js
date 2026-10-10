document.addEventListener('DOMContentLoaded', async () => {
    const page = document.querySelector('.user-admin');
    const list = document.querySelector('#user-list');
    const status = document.querySelector('#user-admin-status');
    const isAdmin = page.dataset.isAdmin === 'true';
    let currentPage = 1;
    const limit = 10;
    let roleNames = [];

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

    const createRoleSelect = (value) => {
        const label = document.createElement('label');
        label.className = 'user-admin__field';
        label.textContent = 'Role';
        const select = document.createElement('select');
        select.name = 'role';
        select.required = true;
        roleNames.forEach((role) => {
            select.append(new Option(role, role, false, role === value));
        });
        label.append(select);
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
            form.append(createRoleSelect(getRoleName(user)));
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

    const renderUsers = ({ data: users, pagination }) => {
        list.replaceChildren();
        if (users.length === 0) {
            setStatus('No users found.');
            return;
        }

        const fragment = document.createDocumentFragment();
        users.forEach((user) => fragment.append(createUserForm(user)));
        list.append(fragment);
        setStatus(`${pagination.totalItems} user${pagination.totalItems === 1 ? '' : 's'} found.`);
        const paginationControls = document.querySelector('.user-admin__pagination');
        if (paginationControls) {
            paginationControls.querySelector('.user-admin__page').textContent =
                `Page ${pagination.page} of ${Math.max(pagination.totalPages, 1)}`;
            paginationControls.querySelector('[data-page="previous"]').disabled =
                pagination.page <= 1;
            paginationControls.querySelector('[data-page="next"]').disabled =
                pagination.page >= pagination.totalPages;
        }
    };

    const loadUsers = async () => {
        setStatus('Loading users...');
        const params = new URLSearchParams({
            page: currentPage,
            limit
        });
        if (isAdmin) {
            const role = document.querySelector('#user-role-filter').value;
            const search = document.querySelector('#user-search').value.trim();
            if (role) params.set('role', role);
            if (search) params.set('q', search);
        }
        const response = await fetch(`/api/users?${params}`);
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

    const populateRoleOptions = (select) => {
        select.replaceChildren(new Option('All roles', ''));
        roleNames.forEach((role) => select.append(new Option(role, role)));
    };

    if (isAdmin) {
        const controls = document.createElement('div');
        controls.className = 'user-admin__controls';
        controls.innerHTML = `
            <label>Search users
                <input id="user-search" type="search" placeholder="Name, username, or email">
            </label>
            <label>Role
                <select id="user-role-filter"></select>
            </label>
            <button type="button" data-action="search">Apply filters</button>
        `;
        page.insertBefore(controls, status);
        controls.querySelector('[data-action="search"]').addEventListener('click', async () => {
            currentPage = 1;
            await loadUsers();
        });
    }

    const pagination = document.createElement('nav');
    pagination.className = 'user-admin__pagination';
    pagination.innerHTML = `
        <button type="button" data-page="previous">Previous</button>
        <span class="user-admin__page"></span>
        <button type="button" data-page="next">Next</button>
    `;
    page.append(pagination);
    pagination.querySelector('[data-page="previous"]').addEventListener('click', async () => {
        currentPage -= 1;
        await loadUsers();
    });
    pagination.querySelector('[data-page="next"]').addEventListener('click', async () => {
        currentPage += 1;
        await loadUsers();
    });

    try {
        if (isAdmin) {
            setStatus('Loading roles...');
            const rolesResponse = await fetch('/api/roles');
            if (!rolesResponse.ok) {
                throw new Error(`Unable to load roles (${rolesResponse.status}).`);
            }
            roleNames = (await rolesResponse.json()).map((role) => role.name);
            populateRoleOptions(document.querySelector('#user-role-filter'));
        }
        await loadUsers();
    } catch (error) {
        console.error(error);
        setStatus(error.message, true);
    }
});
