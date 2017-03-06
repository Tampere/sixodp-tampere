import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
from ckanext.showcase.plugin import ShowcasePlugin

from routes.mapper import SubMapper

class Sixodp_ShowcasePlugin(ShowcasePlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IDatasetForm)

    # IConfigurer

    def update_config(self, config_):
        toolkit.add_template_directory(config_, 'templates')
        toolkit.add_public_directory(config_, 'public')
        toolkit.add_resource('fanstatic', 'sixodp_showcase')



    # IDatasetForm

    def package_types(self):
        return []

    def search_template(self):
        return "sixodp_showcase/search.html"

    def read_template(self):
        return "sixodp_showcase/read.html"

    #def new_template(self):
    #    return 'sixodp_showcase/new.html'

    def before_map(self, map):

        with SubMapper(map, controller='ckanext.sixodp_showcase.controller:Sixodp_ShowcaseController') as m:

            m.connect('ckanext_showcase_new', '/showcase/new', action='new')
            m.connect('ckanext_showcase_read', '/showcase/{id}', action='read',
                      ckan_icon='picture')
            m.connect('ckanext_showcase_edit', '/showcase/edit/{id}',
                      action='edit', ckan_icon='edit')
            m.connect('ckanext_showcase_index', '/showcase', action='search',
                      highlight_actions='index search')

        return map

    #def package_form(self):
    #    return 'scheming/package/snippets/package_form.html'