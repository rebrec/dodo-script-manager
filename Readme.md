# Dodo Script Manager

## Description

Dodo is based on 2 components :

### Dodo Launcher (the client) :

It's a Powershell script (Powershell v2 minimum) that must be run as **SYSTEM**
on every computer you manage (the recommended way is to run it periodically as a
scheduled task at a specific interval like 15 minutes).

It will run every script located within `$DODO_BASE_DIR` :

`$DODO_BASE_DIR` is the root folder which will contain every Powershell script that can be managed using *Dodo Launcher*.

For a Powershell script to be managed by *Dodo Launcher*, it need 2 conditions :

- Its name must start with either **"computermode"** or **"usermode"**
- It must not be within a subfolder whose name is **"disabled"**

The default folder structure of `$DODO_BASE_DIR` is :

```
  DODO_BASE_DIR
    + 01
      - computermode-some_script_that_will_be_run_first.ps1
    + 02
    + 03-default
      - computermode-somescript.ps1
      - usermode-some_other_script.ps1
    + 04
    + 05
    + disabled
      - usermode-a_script_that_wont_run_because_of_being_within_the_disabled_folder.ps1
```

It is designed so that scripts will be executed in alphabetical order (so you can put scripts in different subfolders)
to order their execution the way you want.

#### Script Naming convention : computermode vs usermode

As said before, every Powershell script managed by *Dodo Launcher* must start with either *"computermode"* or *"usermode"*.
*Dodo Launcher* will behave differently while executing scripts depending of their prefix :

- Scripts starting with **"computermode"** will be executed as **SYSTEM** (the current user context since you must run *Dodo Launcher* as **SYSTEM**)
- Scripts starting with **"usermode"** will be executed in the **Current Logged In User context** (the user owning *explorer.exe* in the active session).

That way, for instance, you will be able to :
- Run a script that install an application system wide
- Run a script which interact with the current user profile, and even interact with the interactive session.

#### Script structure

##### Script Header

Every powershell script (computer or user mode) must start with :

```powershell
  $global:DODO_SCRIPT_NAME       = "Some_Scriptname"
  $global:DODO_SCRIPT_VERSION    = "1.0"
```

Thoses 2 informations will be uploaded to **Dodo Server** and will allow the administrator
(you) for each script name and version, to allow or not the execution of this specific
script on a specific computer or for a specific user (by adding thoses computers
or users to the script's "tester" list).

Please note that thoses 2 variables are just strings, so the version number could be anything and not only numerical values.

##### Script Body

After the declaration of the 2 variables identifying the script name and version,
a typical script will look like this :

```powershell
# If needed, uncomment this function to be able to track script execution
# according to something different than just the computername
# (ie : host-user, or host-user-some_uniq_id_per_installation, ...)
# The default behaviour is to be based on $env:COMPUTERNAME
#
# Function global:Get-UniqueExecutionId {  
#     return "$env:COMPUTERNAME-$env:USERNAME"
# }
#
# If needed add specific conditions before allowing execution (timerange, specific date, etc)
# Function global:isDodoExecutionContextCorrect {
#     return $true # return $true to allow execution, else return $false
# }

# The Main Function is called only if thoses 2 conditions are met:
# - Dodo Server allow execution of the script for the specific UniqueExecutionId
#   returned by global:Get-UniqueExecutionId
# - The call to global:isDodoExecutionContextCorrect return $true
Function Main{
	logDodo "Here is a message that will be printed both to standard output and"
	logDodo "uploaded to Dodo Server at the end of the execution of the Main function"
	logDodo "This way the Dodo Server Administrator will be able to retrieve"
	logDodo "usefull information about the script execution (either the execution is"
	logDodo "successfull or not."
	$someCheck = $true
  # We save the execution status so that we do not execute it twice
	If ($someCheck -eq $true){
		return $true  # Execution is correct (Dodo Server will mark this script as being
                  # executed successfully so it won't execute again
	} else {
		return $false # Execution is NOT correct (Dodo Server will mark this script as being
                  # executed successfully so it will execute again next time
                  # Dodo Launcher is called
	}
}
```


### Dodo Server

It's the Node.js webservice that **Dodo Launcher** communicate with.

It is as 2 roles :

- It has an API endpoint that each script that **Dodo Launcher** execute will user
  behind the scene to :
  - Know if the script is allowed to run (either the computer/user running the script
    is a "tester", or the script is in production and should be executed by everybody)
  - Save the execution status (success / failure, execution logs, environmental informations,...)
- It host a Web application that administrators will use to :
  - Add / Remove testers for each scripts
  - Switch a script from Beta mode to Production mode (by default every new script
    is in "beta" mode. This mean that it won't execute on a computer except if the
    specified computer is set as "tester". When switched to "production" the script
    execute on every machine running **Dodo Launcher**).
  - See script execution logs for each host
  - Retrieve a list of hosts running a specific script with details like Execution
    Time, Execution Status, host ip address, uptime, etc.
- It also offer a Powershell Module to use every features available in the Web
  application (this way, you can, in a few line of code, Select every computer with,
  let's say, a specific uptime, and add them as tester for a specific script, or you
  could also easily extract a list of hosts which has executed a specific script and
  whose execution logs contain some specific keyword, ...)


## Why use Dodo ?

### Usual problems

In system administrator's daily life, you are often in the need to run a new
script on every single computer of your company.

Sometimes the script you want to execute is not as perfect as you thought, so, either,
you made a deployment for your whole company and you are facing tons of phone calls
telling you that something weird is happening on every user's computers, or you have
been good enough and are currently running your script to only a bunch of users / computers
(and when everything will works as expected, you will add a few other "testers" and
then, push the Script to your whole company).

All thoses situations lead to quite a lot of effort for yourself :
- you have sometimes the need to gather environmental informations (powershell version,
uptime, etc) on a specific computer where things doesn't work as expected
- you need to choose tester that are powered on, on a specific ip subnet maybe
- after running "blindly" the script silently, you will have to connect to the tester computer
to check some logs that your script generate (each script may not use the same logging scheme maybe...)

It is also interesting to know where the script has been executed and if it was
executed properly from a central place.

### Solutions that Dodo solve

With the help of Dodo, you will now be able to :
- Quickly execute a just crafted script : first, dodoLauncher won't execute it since every
  dodo script are in beta mode when created, then, you will choose the right computer, or user,
  maybe you will want some computer that has just communicated with Dodo Server so that you can
  do some testing "live". Then you will click on each desired host to add them as "tester".
  That way, next time dodoLauncher will run, it will execute your script. You will instantly
  retrieve the execution log and will know, wether the execution was successful or not. If something
  is not working as expected, you will be able to read host environmental data and will perhaps quickly
  discover that every computer whose Powershell version is less than v3 doesn't execute the script properly.
- Access to host environmental informations uptime, ip address, current user, whatever else you need
  (this can be extended for each script easily)
- Switch the script to production when you have validated on enough testers that the script
  works perfectly.
- Watch "live" the execution count increase, to see the progression of your deployment.
- Have access to a bunch of logs if needed on the computer executing Dodo Launcher in case
  of advanced troubleshooting.


## Prerequisites

You will need :

- A Server (Linux is probably the easier choice) hosting the **Dodo Server**
- A Windows Network share trusted in your company (usually a subfolder of your
  company's DFS domain root will be perfect, ie : `\\corp.contonso.com\netlogon\DODO\`)
- A computer from which you will :
  - Download the sources,
  - Deploy the server,
  - Install and configure the **Dodo Launcher** Root directory
  - Upload scripts

## Installation

*Note : to install this software, you will have to download the source using `git`
If you are a Windows user and don't know how to simply get and use git, i recommend
you to get [Babun](http://babun.github.io/). This software will provide you with a
sort of Linux Console on your Windows computer with a lot of useful tools like `git`*

### Dodo Server

**TLDR** : Run this code as user `root`

```
apt-get install curl
adduser dodo
su - dodo
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
$SHELL
nvm install v6.9.4
npm install pm2 -g
git clone https://github.com/rebrec/dodo-script-manager.git
cd dodo-script-manager
npm i
pm2 start app
pm2 Save
############################################################################################
# Please Read carefully the output of the next command :
# pm2 will now ask you to run some command as root.
# so simply copy / paste it to your terminal
############################################################################################
pm2 startup
exit 2>1 1>/dev/null
exit 2>1 1>/dev/null
```

**Explaination :**

Install curl

```
apt-get install curl
```

Create a user `dodo` with

```
adduser dodo
```

Switch to this new user using

```
su - dodo
```

Install [nvm](https://github.com/creationix/nvm) :

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
```

Run your current shell again to be able to use nvm

```
$SHELL
```

Install needed version of [Node.js]([https://nodejs.org/)

```
nvm install v6.9.4
```

Install [pm2](http://pm2.keymetrics.io/) :

```
npm install pm2 -g
```

Clone this repository :

```
git clone https://github.com/rebrec/dodo-script-manager.git
```

Enter the repository folder

```
cd dodo-script-manager
```

Installed needed packages

```
npm i
```

Run the server

```
pm2 start app
```

Save current process list managed by pm2 to run at server startup

```
pm2 Save
```

Generate startup script for your distribution (auto detection)
```
pm2 startup
```

**The previous command will display a command that you have to run as *root*.**

Exit the previous new shell and exit su command (to go back as root so you can paste your command)

```
exit 2>1 1>/dev/null
exit 2>1 1>/dev/null
```

Now you should be `root` again, to type the command suggested by `pm2 startup`


If everything went well, you should be able to access Dodo Server using your browser at
`http://YOUR_SERVER_IP:8088/` and whenever you restart your server, **Dodo Server** will 
be run again.


### Dodo Launcher

#### Setup the repository
- Download the source using : `git clone https://github.com/rebrec/dodo-script-manager.git`
- Create a folder named `DODO` in your company's DFS domain root (`\\corp.contoso.com\netlogon\DODO`)
- Copy the `powershell\script_root` subfolder's content to the above network share
- Copy `\\corp.contoso.com\netlogon\DODO\example\config.ps1` to `\\corp.contoso.com\netlogon\DODO\`
  and edit if needed path informations in this file to suite your specific needs (you don't need to
  edit it if you want to do a default installation).
- Copy `\\corp.contoso.com\netlogon\DODO\example\demo` folder to `\\corp.contoso.com\netlogon\DODO\scripts\demo`.
  This will provide a demo script that has no impact on computers but will be used for starting working
  on **Dodo Server**
- Copy

#### Initial test from your own computer

#### Deploy the client

You will need to create a scheduled task on every computer that will run at a specific interval :
**PUT FULL COMMAND LINE HERE**
```
powershell ....... \\corp.contoso.com\netlogon\DODO\Dodo_Launcher.ps1
```

You can create such scheduled task using the following command :
**PUT FULL COMMAND LINE HERE**
```
schtasks / XXXXXXXXX
```

*Performance considerations : You may need to define a different interval for your scheduled task
depending on the location of your clients :
- If running on the LAN, i would suggest to be about 15 minutes
- If running on slow WAN connections, you may increase the interval to 30 minutes maybe
You may also want to increase this interval if you have a lot of clients (maybe 1000+) to not
overload the server / and your network.
All this will also depend of what you will do in scripts that you will deploy (if one of your Scripts
copy some big file over the network, for instance, you will have to increase the update interval)*



## Issues

## Contribute

## Donate
