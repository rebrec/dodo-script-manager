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

That way, you will be able either to run scripts able to change system settings for instance, but also other which interact with the current user
profile, or even interact with the interactive session.

#### Script structure

##### Script Header

Every powershell script (computer or user mode) must start with :

  $global:DODO_SCRIPT_NAME       = "Some_Scriptname"
  $global:DODO_SCRIPT_VERSION    = "1.0"

Thoses 2 informations will be uploaded to **Dodo Server** and will allow the administrator (you) to allow or
not the execution of this specific script on a specific computer for instance based on the scriptname and the script version.

Please note that thoses 2 variables are just strings, so the version number could be anything and not only numerical value.

##### Script Body

```powershell
# If needed, uncomment this function to be able to track script execution
# According to something different than just the computername
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

- It has an API endpoint for each script that **Dodo Launcher** execute.
- It host a Web application that administrators will access to :
  - Add / Remove testers for each scripts
  - Switch a script from Beta mode to Production mode (by default every new script
    is in "beta" mode. This mean that it won't execute on a computer except if the
    specified computer is set as "tester". When switched to "production" the script
    execute on every machine running **Dodo Launcher**).
  - See script execution logs
  - Retrieve a list of hosts running a specific script with details like Execution
    Time, Execution Status, host ip address, uptime, etc.
- It also offer a Powershell Module to script every features available in the Web
  application (this way, you can in a few line of code Select every computer with,
  let's say a specific uptime, and add them as tester for a specific script, or you
  could also easily extract a list of hosts which has executed a specific script and
  whose execution logs contain some specific keyword, ...)


## Why use Dodo ?

### Usual problems

In system administrator's daily life, you are often in the need to run a new script on every single computer
of your company.

Sometimes the script you want to execute is not as perfect as you thought, so, either, you made a deployment
for your whole company and you are facing tons of phone calls telling you that something weird is happening on every
user's computers, or you have been good enough and are currently running your script to only a bunch of users /
computers (and when everything will works as expected, you will add a few other "testers" and then, push the Script
to your whole company).

All thoses situations lead to quite a lot of effort for yourself, you will have sometimes the need to gather
environmental informations (powershell version, uptime, etc) on a specific computer where things doesn't work as expected,

It is also interesting to know where the script has been executed and if it was executed properly.

### Solutions that Dodo solve

With the help of Dodo, you will now be able to :
- quickly execute a just crafted script : first, dodoLauncher won't execute it since every
  dodo script are in beta mode when created, then, you will choose the right computer, or user,
  maybe you will want some computer that has just communicate with Dodo Server so that you can
  do some testing "live". Then you will click on each desired host to add them as "tester".
  That way, next time dodoLauncher will run, it will execute your script. You will instantly
  retrieve the execution log and will know, wether the execution was successful or not. If something
  is not working as expected, you will be able to read host environmental data and will perhaps quickly
  discover that every computer whose Powershell version is less than 3 doesn't execute the script properly.
- have access to a bunch of logs if needed on the computer executing Dodo Launcher in case
  of advanced troubleshooting.
- switch the script to production when you have validated on enough testers that the script
  works perfectly.
- watch "live" the execution count increase, to see the progression of your deployment.

## Installation

### Dodo Launcher


### Dodo Server


## Issues

## Contribute

## Donate
