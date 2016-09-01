## Open Data Portal of the Six City Strategy

This repository provides the open data catalog of the [Six City Strategy](http://6aika.fi/in-english/) in Finland.

Live demo at https://demo.dataportaali.com

### Getting started

Prerequisites:

- [Vagrant](https://www.vagrantup.com/) (tested on 1.8.5)
- [VirtualBox](https://www.virtualbox.org/) (tested on 5.1.2)

Clone the repository and its submodules, and start Vagrant:

    git clone https://github.com/6aika/sixodp.git
    cd sixodp/
    git submodule update --init --recursive
    vagrant up

After [Ansible](http://www.ansible.com/) provisions the system, the service will be running in the virtual machine and is available from your host machine at https://10.106.10.10/

User credentials for an administrator are `admin:admin`, and `test:test` for a regular user.

To reprovision the server (i.e. to run Ansible) again:

    vagrant provision

You can ssh into the server:

    vagrant ssh

And you can also run Ansible manually inside the virtual machine:

    vagrant ssh
    cd /src/ansible
    ansible-playbook -v -i inventories/vagrant deploy-all.yml

### Development

With Vagrant, the host machine shares the working directory into the virtual machine. The web server uses the CKAN extensions directly from the source code via symlinks. Depending on what you change however, some extra rules apply:

- If you edit a Jinja template, changes apply instantly (only page refresh required)
- If you edit Python code of the extensions, you need to restart the WSGI server (`vagrant ssh` and `sudo service apache2 restart`).
- If you edit Javascript, you need to run the frontend build to compile and minify files (`vagrant ssh`, `cd /src/ansible` and `ansible-playbook -v -i inventories/vagrant frontend-build.yml`).

### Repository structure

    .
    ├── ansible
    │   ├── deploy-all.yml                  Top-level playbook for configuring complete service
    │   ├── inventories                     Target server lists (hostname, ssh user and key)
    │   ├── roles                           Main configuration
    │   └── vars                            Variables common for all roles
    │       ├── api-catalog-secrets         Passwords and other secrets (not included here)
    │       ├── common.yml                  Variables common for all roles and environments
    │       ├── environment-specific        Configuration specific for each deployment env
    │       └── secrets-defaults.yml        Default passwords, used in Vagrant
    ├── ckanext                             Custom CKAN extensions, main source directory
    ├── doc                                 Documentation
    └── Vagrantfile                         Configuration for local development environment

### Support / Contact / Contribution

Please file a [new issue](https://github.com/6aika/sixodp/issues) at GitHub.

### Copying and License

This material is copyright (c) 2015-2016 Population Register Centre.

CKAN-related content like [CKAN extensions](/ckanext) are licensed under the GNU Affero General Public License (AGPL) v3.0 whose full text may be found at: http://www.fsf.org/licensing/licenses/agpl-3.0.html

All other content in this repository is licensed under the MIT license.
