# INTRO

This demo is designed to work in our provided artifact (as docker images) to deploy SWAPP. Please check our Zenodo link to use these demo. The install.sh and deploy.sh scripts are based on Ubuntu. 

If your system does not have docker installed, simply execute install.sh. After it has finished, execute deploy.sh. The deploy.sh script will unzip public_html.zip and change permission of the extracted folder. Then, it will deploy docker instances neccessary to run SWAPP.

Note that the instances run common HTTP and SQL ports. When encounter an error, please stop other Apache2 or SQL running services.

We provide several a demo page for each of the four apps discussed in the paper. When interacting with each demo, please make sure the previous demo's service worker are removed. This is to prevent other service workers from crashing the current demo.

# SWAPP APPS DEMONSTRATION

## Wordpress with SWAPP (Apps enabled are workbox, cache guard, autofill guard, and dom guard):

- Access SWAPP by typing http://localhost in a browser. This will prompt you to setup a Wordpress page. 
- Follow the instruction on the installation page. No specific configuration is needed to set up. 
- After the setup is finished, you can interact with SWAPP deployed on Wordpress.
- Use Chrome DevTools to inspect the console and service worker. 


## SWAPP's Cache Guard:

- Access Cache Guard demo at http://localhost/demo/cacheguard/index.html.
- Visit the page and interact with our app Cache Guard. Further details are provided on the web page.


## SWAPP's Autofill Guard (with phpBB):

- Access Cache Guard demo at http://localhost/demo/autofillguard/.
- Visit the page to install phpBB and interact with Autofill Guard.
- Use the following database credential:
  - Database server hostname: mysql
  - Database username: wp_user
  - Database password: wp_password
  - Database name: wordpress
- After installation, remove the /public_html/demo/autofillguard/install folder.
- Click "Take me to the ACP" and click "Logout" of the admin account.
- Visit http://localhost/demo/autofillguard/. You should see a login form within an iFrame. 
- In the case the iFrame does not show up, try refreshing the web page.
- Interact with the login form using the admin credentials to see if Autofill Guard works.


## SWAPP's Data Guard:

- Access Cache Guard demo at http://localhost/demo/data_guard/index.html.
- Visit the website for further instructions.


## SWAPP's DOM Guard:

- Access Cache Guard demo at http://localhost/demo/domguard/index.html.
- Visit the website for further instructions.
