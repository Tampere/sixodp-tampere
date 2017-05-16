import logging
import httplib
import ckan.lib.base as base
from pylons import config
import json
import ckan.lib.i18n as i18n
import ckan.logic as logic
import ckan.model as model
import ckan.plugins.toolkit as tk
from ckan.model.package import Package
from ckan.lib.dictization.model_dictize import group_list_dictize

from pylons.i18n import gettext
from ckanext.scheming.helpers import lang
from ckan.common import _
from webhelpers.html import literal
from ckan.logic import get_action
import ckan.lib.helpers as helpers


NotFound = logic.NotFound
abort = base.abort
request = tk.request

log = logging.getLogger(__name__)

# Fetches any CMS content under the configured wp_api_base_url endpoint
def get_wp_api_content(endpoint, action):
    response_data_dict = {}
    try:
        connection = httplib.HTTPConnection(config.get('ckanext.sixodp_ui.cms_site_url'))
        url = endpoint + "/" + action
        connection.request("GET", url)
        response_data_dict = json.loads(connection.getresponse().read())
        connection.close()
    except:
        log.error('Connection to WP api failed')

    return response_data_dict


def get_notifications():
    notifications_endpoint = config.get('ckanext.sixodp_ui.wp_api_base_url')
    response_data = get_wp_api_content(notifications_endpoint, 'notification')
    notifications = []

    if (type(response_data) is list):
        for item in response_data:
            notifications.append({
                'title': item['title']['rendered'],
            })

    return notifications


def get_navigation_items_by_menu_location(wp_menu_location, localized):
    menu_endpoint = config.get('ckanext.sixodp_ui.wp_api_menus_base_url')

    if (localized == True):
        response_data = get_wp_api_content(menu_endpoint, 'menus/' + wp_menu_location + '_' + i18n.get_lang())
    else:
        response_data = get_wp_api_content(menu_endpoint, 'menus/' + wp_menu_location)

    navigation_items = []
    if(response_data and response_data.get('items')):
        for item in response_data['items']:
            navigation_items.append({
                'title': item.get('title'),
                'url': item.get('url'),
                'children': item.get('children')
            })

    return navigation_items


def get_footer_navigation_items():
    return get_navigation_items_by_menu_location(config.get('ckanext.sixodp_ui.wp_footer_menu_location'), True)


def get_social_links():
    return get_navigation_items_by_menu_location(config.get('ckanext.sixodp_ui.wp_social_menu_location'), False)


def get_social_link_icon_class(item):
    if(item.get('title').lower() == 'facebook'):
        return 'icon-facebook-sign'
    elif(item.get('title').lower() == 'twitter'):
        return 'icon-twitter-sign'
    elif(item.get('title').lower() == 'youtube'):
        return 'icon-youtube-sign'
    elif(item.get('title').lower() == 'rss'):
        return 'icon-rss-sign'
    elif(item.get('title').lower() == 'tumblr'):
        return 'icon-tumblr-sign'
    elif(item.get('title').lower() == 'github'):
        return 'icon-github-sign'
    elif(item.get('title').lower() == 'instagram'):
        return 'icon-instagram'
    elif(item.get('title').lower() == 'linkedin'):
        return 'icon-linkedin-sign'
    elif(item.get('title').lower() == 'flickr'):
        return 'icon-flickr'
    else:
        return 'icon-external-link-sign'


def menu_is_active(menu_url, current_path):
    return current_path in menu_url


# This is not the most efficient way of listing package groups that include all group schema fields, however
# at this point the only way without major CKAN core changes
def get_package_groups(package_id):
    context = {'model': model, 'session': model.Session,
               'for_view': True, 'use_cache': False}

    data_dict = {
        'all_fields': True,
        'include_extras': True
    }

    groups = get_action('group_list')(context, data_dict)
    group_list = []

    try:
        pkg_obj = Package.get(package_id)
        pkg_group_ids = set(group['id'] for group
                        in group_list_dictize(pkg_obj.get_groups('group', None), context))

        group_list = [group
                     for group in groups if
                     group['id'] in pkg_group_ids]

    except (NotFound):
        abort(404, _('Dataset not found'))

    return group_list


_LOCALE_ALIASES = {'en_GB': 'en'}

def get_translated(data_dict, field):
    if(data_dict.get(field+'_translated')):
        language = i18n.get_lang()
        if language in _LOCALE_ALIASES:
            language = _LOCALE_ALIASES[language]

        try:
            return data_dict[field+'_translated'][language]
        except KeyError:
            return data_dict.get(field, '')
    return data_dict.get('display_name')


def get_current_lang():
    return i18n.get_lang()


# Copied from core ckan to call over ridden get_translated
def dataset_display_name(package_or_package_dict):
    if isinstance(package_or_package_dict, dict):
        return get_translated(package_or_package_dict, 'title') or \
               package_or_package_dict['name']
    else:
        # FIXME: we probably shouldn't use the same functions for
        # package dicts and real package objects
        return package_or_package_dict.title or package_or_package_dict.name


def scheming_language_text_or_empty(text, prefer_lang=None):
    """
    :param text: {lang: text} dict or text string
    :param prefer_lang: choose this language version if available

    Convert "language-text" to users' language by looking up
    language in dict or using gettext if not a dict
    """
    if not text:
        return u''

    if hasattr(text, 'get'):
        try:
            if prefer_lang is None:
                prefer_lang = lang()
        except:
            pass  # lang() call will fail when no user language available
        else:
            if prefer_lang in _LOCALE_ALIASES:
                prefer_lang = _LOCALE_ALIASES[prefer_lang]
            try:
                return text[prefer_lang]
            except KeyError:
                return ''

    t = gettext(text)
    if isinstance(t, str):
        return t.decode('utf-8')
    return t


def resource_display_name(resource_dict):
    name = get_translated(resource_dict, 'name')
    if name:
        return name

    else:
        return resource_dict['name']


def check_if_active(menu):
    return helpers.full_current_url() == menu.get('url')


def build_nav_main():

    navigation_tree = get_navigation_items_by_menu_location(config.get('ckanext.sixodp_ui.wp_main_menu_location'), True)

    def construct_menu_tree(menu):
        active = check_if_active(menu)
        children = ''

        if(menu.get('children')):
            for child_item in menu.get('children'):
                # Parent will be set as active if any of its children is active
                if (check_if_active(child_item)):
                    active = True

                children += construct_menu_tree(child_item)

        if(len(children) > 0):
            return make_menu_item(menu, active) + literal('<ul class="nav navbar-nav subnav">') + children + literal('</ul></li>')
        else:
            return make_menu_item(menu, active) + literal('</li>')

    navigation_html = ''
    for menu in navigation_tree:
        navigation_html += construct_menu_tree(menu)

    return navigation_html


def make_menu_item(menu_item, active):
    link = literal('<a href="') + menu_item.get('url') + literal('">') + menu_item.get('title') + literal('</a>')

    if active:
        return literal('<li class="active">') + link
    return literal('<li>') + link