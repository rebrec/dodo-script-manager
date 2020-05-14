param (
	[switch] $Help,
	[switch] $UsermodeOnly,
	[switch] $ComputermodeOnly,
	[string] $SpecificScript,
	[string] $DODO_LIB_PATH,
	[string] $DODO_BASE_DIR,
	[string] $DODO_SCRIPT_DIR,
	[string] $DODO_TEMPLATE_DIR,
	[string] $DODO_BIN_DIR,
	[switch] $NoConsoleOutput,
	[switch] $Debug,
	[switch] $ShowLog
)

# This script will run every PS1 scripts within $DODO_BASE_DIR
# For being executed, scripts filenames must start with either 'computermode' 
# or 'usermode'
# Scripts withing the 'disabled' subfolder won't be executed
#
# This script is supposed to be run as SYSTEM account. When named as 'usermode'
# The current user will be extracted from the owner of the explorer.exe process
# Then this user will be impersonated to run the script within the user environment
$date = Get-Date; 
$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition
$configFile = "$scriptPath\config.ps1"
if ($(Test-Path $configFile) -ne $true) {
    Write-Warning "#####################################################################"
    Write-Warning "# Missing Config.ps1 file !"
    Write-Warning "# Please start by copying the one available in the 'example' folder"
    Write-Warning "#####################################################################"
    throw "Missing $configFile" 
}
Import-Module $configFile

$timestamp = "{0:0000}{1:00}{2:00}{3:00}{4:00}{5:00}" -f $date.Year, $date.Month, $date.Day, $date.Hour, $date.Minute,$date.Second,$date.Millisecond
$DODO_LOG_DIR = New-Item -ItemType Directory -Force -Path "$($env:TEMP)\DODO"

$DODO_LOG_FILE = "$DODO_LOG_DIR\$timestamp-Launcher.log"

if ($DODO_BASE_DIR      -eq "") { $DODO_BASE_DIR       = $DEFAULT_DODO_BASE_DIR }
if ($DODO_BIN_DIR       -eq "") { $DODO_BIN_DIR        = "$DODO_BASE_DIR\bin" }
if ($DODO_SCRIPT_DIR    -eq "") { $DODO_SCRIPT_DIR     = "$DODO_BASE_DIR\scripts" }
if ($DODO_TEMPLATE_DIR  -eq "") { $DODO_TEMPLATE_DIR   = "$DODO_BASE_DIR\templates" }
if ($DODO_LIB_PATH      -eq "") { $DODO_LIB_PATH       = $DEFAULT_DODO_LIB_PATH }
if ($SpecificScript     -eq "") { $SpecificScript      = $DEFAULT_SpecificScript }

if ($DEFAULT_DODO_BIN_DIR     ) { $DODO_BIN_DIR        = $DEFAULT_DODO_BIN_DIR }
if ($DEFAULT_DODO_SCRIPT_DIR  ) { $DODO_SCRIPT_DIR     = $DEFAULT_DODO_SCRIPT_DIR }
if ($DEFAULT_DODO_TEMPLATE_DIR) { $DODO_TEMPLATE_DIR   = $DEFAULT_DODO_TEMPLATE_DIR }

if ($PSBoundParameters.ContainsKey("Debug") -ne $true){
    $Debug = $DEFAULT_DODO_Debug
}
if (Test-Path "$DODO_LOG_DIR\debug") { $Debug = $true }
if ($Debug) { $DODO_LAUNCHER_LOG_LEVEL = 100 }

$RUN_HIDDEN_ELEVATED           = "$DODO_BIN_DIR\run_hidden-elevated.exe"
$RUN_HIDDEN_NORMAL             = "$DODO_BIN_DIR\run_hidden-normal.exe"
$spacer = "    "

Function Log-Message{
    param(
        [Alias("v")]
        [ValidateNotNullOrEmpty()]
        $verbosity,
        [ValidateNotNullOrEmpty()]
        $message
    )
    if ($verbosity -gt $DODO_LAUNCHER_LOG_LEVEL) { return }
    Write-Output $message  | % { 
		if ($NoConsoleOutput -ne $True) { Write-Host $_ }
		Out-File -FilePath $DODO_LOG_FILE -Append -InputObject $_ 
	}       
}

Function Start-ProcessAndLog{
    param(
        [ValidateNotNullOrEmpty()][string] $logName,
        [ValidateNotNullOrEmpty()][string] $FilePath,
        [switch] $runAsCurrentUser,
        $ArgumentList
    )
    $spacer = "    "
    Log-Message -v 5 " "
    $outputFile    = "$DODO_LOG_DIR\$timestamp-$logName-both.log"
    $arguments = " /c " + '"' + "$FilePath $ArgumentList 2>&1 > $outputFile" + '"'
    if ($runAsCurrentUser) {
       	# working example mshta.exe vbscript:Execute("cmd = ""cmd.exe"" : Set shell = CreateObject(""WScript.Shell"") : shell.Run cmd, 0, true : Set shell=Nothing:window.close")
        ## the below line would have been perfect but it seems there is a string length limitation that is reached
        # $commandline = 'mshta.exe vbscript:Execute("cmd = ""cmd.exe /c """"sleep 5 && ' + "$cmd $ArgumentList 2>&1 > $outputFile" + '"""""" : Set shell = CreateObject(""WScript.Shell"") : shell.Run cmd, 0, true : Set shell=Nothing:window.close")'
        $commandline = "$RUN_HIDDEN_NORMAL cmd.exe" + $arguments
        Log-Message -v 5 "Usermode : running Start-ProcessAsCurrentUser -wait  -commandline $commandline ... [$($commandline.Length)]"
        Start-ProcessAsCurrentUser -wait  -commandline $commandline
        Log-Message -v 3 " "
        Log-Message -v 3 "## OUTPUT and ERROR START : $outputFile"

        $content = $(Get-Content -encoding OEM $outputFile)
        if (-not $content) { 
            $content = "$($spacer)No output"
            Log-Message -v 3 $content
        } else {
            $content | % { Log-Message -v 3 "$($spacer)$_" }
        }
        
        Log-Message -v 3 "## OUTPUT and ERROR END"
        
    } else {
        Log-Message -v 5 "Computermode : running Start-Process -FilePath cmd.exe -ArgumentList $arguments -wait ... [$($arguments.Length)]"
        Start-Process -FilePath "cmd.exe" -ArgumentList $arguments -wait
        Log-Message -v 3 " "
        Log-Message -v 3 "## OUTPUT and ERROR START : $outputFile"
        $content = $(Get-Content -encoding OEM $outputFile)
        if (-not $content) { 
            $content = "$($spacer)No output" 
            Log-Message -v 3 $content
        } else {
            $content | % { Log-Message -v 3 "$($spacer)$_" }
        }
        Log-Message -v 3 "## OUTPUT and ERROR END"
        Log-Message -v 3 " "
    }
    if (Test-Path $outputFile) {
        Remove-Item -Path $outputFile -Force
    }
	    
}

Function Main{
    # Remove Log files older than 15 days
    $limit = (Get-Date).AddDays(-15)
    # Delete files older than the $limit.
    Get-ChildItem -Path $DODO_LOG_DIR -Recurse -Force | Where-Object { !$_.PSIsContainer -and $_.CreationTime -lt $limit } | Remove-Item -Force

	Log-Message -v 1 "Generation of Logfile $DODO_LOG_FILE"
	Log-Message -v 1 "###########################################################"
	Log-Message -v 2 "Environment variables : "
	Log-Message -v 2 " - DODO_BASE_DIR    		 	= $DODO_BASE_DIR"
	Log-Message -v 2 " - DODO_BIN_DIR      			= $DODO_BIN_DIR"
	Log-Message -v 2 " - DODO_SCRIPT_DIR   			= $DODO_SCRIPT_DIR"
	Log-Message -v 2 " - DODO_TEMPLATE_DIR 			= $DODO_TEMPLATE_DIR"
	Log-Message -v 2 " - DODO_LOG_DIR     			= $DODO_LOG_DIR"
	Log-Message -v 2 " - DODO_LIB_PATH     			= $DODO_LIB_PATH"
	Log-Message -v 2 " - UsermodeOnly      			= $UsermodeOnly"
	Log-Message -v 2 " - ComputermodeOnly  			= $ComputermodeOnly"
	Log-Message -v 2 " - SpecificScript    			= $SpecificScript"
	Log-Message -v 2 " - DODO_LAUNCHER_LOG_LEVEL    = $DODO_LAUNCHER_LOG_LEVEL"
	Log-Message -v 2 " - Debug             			= $Debug"
	Log-Message -v 2 "###########################################################"
	Log-Message -v 2 "- Granting access to 'everyone' to the file"
	$cmd = 'icacls.exe'
	
    $parameters = "$DODO_LOG_DIR" + '  /grant "Tout le monde:(OI)(CI)F" /T'
	Start-ProcessAndLog -logName "icacls" -FilePath $cmd -ArgumentList $parameters 
	
	$scripts 		= Get-ChildItem -Path "$DODO_SCRIPT_DIR\" -Filter "*.ps1"     -Recurse | ? { $_.FullName -notmatch 'disabled' }
	if ($SpecificScript) { 
		$scripts 		= Get-ChildItem -Path $SpecificScript -Recurse | ? { $_.FullName -notmatch 'disabled' }
	}
	else {
		$scripts 		= Get-ChildItem -Path "$DODO_SCRIPT_DIR\" -Filter "*.ps1"     -Recurse | ? { $_.FullName -notmatch 'disabled' }
	}
	$scripts | % {
		$file = $_
		if ($file.Name -imatch '^usermode-.*'){
			if ($ComputermodeOnly -ne $true) { Run-DodoScript -Usermode $_ -Debug:$Debug }
		} elseif ($file.Name -imatch '^computermode-.*'){
			if ($UsermodeOnly -ne $true) { Run-DodoScript $_ -Debug:$Debug }
		} else {
			Log-Message -v 1 "Skipping malformed scriptname $($file.Name)"
		}
	}
    if ($ShowLog) { start $DODO_LOG_FILE }
}


Function Get-DodoEncodedLauncher{
	param (
        [ValidateNotNullOrEmpty()]
        [string] $scriptFullPath,
        [switch] $Debug
    )
    $variables = New-Object -TypeName PSCustomObject
    Add-Member -InputObject $variables -MemberType NoteProperty -Name "DODO_LIB_PATH"     -Value $DODO_LIB_PATH
    Add-Member -InputObject $variables -MemberType NoteProperty -Name "DODO_LOG_FILE"     -Value $DODO_LOG_FILE
    Add-Member -InputObject $variables -MemberType NoteProperty -Name "scriptFullPath"    -Value $scriptFullPath
    Add-Member -InputObject $variables -MemberType NoteProperty -Name "Debug"             -Value $Debug
    $command = $(Get-ScriptFromTemplate -variables $variables)

	#if ($debug) { Log-Message -v 3 "[Get-DodoEncodedLauncher] Generating base64 string from : `r`n$command" }
	$b64command = [System.Convert]::ToBase64String([System.Text.Encoding]::UNICODE.GetBytes($command))	
	return $b64command
}

Function Get-ScriptFromTemplate{
    param(
        [ValidateNotNullOrEmpty()] $variables,
        [string] $template="default"
    )
    Log-Message -v 5 "[Get-ScriptFromTemplate] Variables are :"
    Log-Message -v 5 "[Get-ScriptFromTemplate] $variables"
	$templateFullPath = "$DODO_TEMPLATE_DIR\\$template.ps1"
    #$templateContent = Get-Content -raw $templateFullPath
    $templateContent = Get-Content $templateFullPath | Out-String
    $variables.PsObject.Properties | % {
        $templateContent = $templateContent -replace "@@$($_.Name)", $_.Value
    }
    if ($Debug) {
        $scriptFilename = $(gci $($variables.scriptFullPath)).Name
        $scriptFullPath = "$DODO_LOG_DIR\\$timestamp-generated-script-$scriptFilename"
        Log-Message -v 1 "Creating debug script : $scriptFullPath"
        Write-Output $templateContent | Out-File -FilePath $scriptFullPath
    }
    $templateContent

}
Function Run-DodoScript{
	param (
        [ValidateNotNullOrEmpty()]
        [System.IO.FileSystemInfo] $script,
        [switch] $Usermode,
        [switch] $Debug
    )
	$b64command    = (Get-DodoEncodedLauncher -Debug:$Debug -scriptFullPath $($script.FullName))
	$cmd        = "powershell.exe"
    $parameters = ""
	#if ($Debug -eq $true) {
	#	$parameters += " -NoExit"
	#}
	$parameters += " -NonInteractive -Noprofile -ExecutionPolicy Unrestricted -EncodedCommand $b64command"
	Log-Message -v 1 "[Run-DodoScript] Going to launch $($script.FullName) (Usermode=$Usermode)"
	Start-ProcessAndLog -logName $script.Basename -FilePath $cmd -ArgumentList $parameters -runAsCurrentUser:$Usermode
	
}

Function Show-Help {
	$helpMsg = @"
Dodo Launcher Script
Available parameters :
  -Help                 : Display this help message
  -UsermodeOnly         : Execute only Usermode scripts
  -ComputermodeOnly     : Execute only Computermode scripts
  -SpecificScript       : Execute only the specified script
  -NoConsoleOutput      : Only Output to Logfile
  -Debug                : Enable Debug messages

"@
	Write-Host $helpMsg
}





#region function Start-ProcessAsCurrentUser param([string] $commandline,$workingDir, $wait) 


# CODE START inspired from https://www.chasewright.com/session0bypass/ 
$Source = @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security;

namespace Session0
{
    /// 

    /// Class that allows running applications with full admin rights. In
    /// addition the application launched will bypass the Vista UAC prompt.
    /// 

    public class AppLaunch
    {
        #region Structures

        [StructLayout(LayoutKind.Sequential)]
        public struct SECURITY_ATTRIBUTES
        {
            public int Length;
            public IntPtr lpSecurityDescriptor;
            public bool bInheritHandle;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct STARTUPINFO
        {
            public int cb;
            public String lpReserved;
            public String lpDesktop;
            public String lpTitle;
            public uint dwX;
            public uint dwY;
            public uint dwXSize;
            public uint dwYSize;
            public uint dwXCountChars;
            public uint dwYCountChars;
            public uint dwFillAttribute;
            public uint dwFlags;
            public short wShowWindow;
            public short cbReserved2;
            public IntPtr lpReserved2;
            public IntPtr hStdInput;
            public IntPtr hStdOutput;
            public IntPtr hStdError;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct PROCESS_INFORMATION
        {
            public IntPtr hProcess;
            public IntPtr hThread;
            public uint dwProcessId;
            public uint dwThreadId;
        }

        #endregion

        #region Enumerations

        enum TOKEN_TYPE : int
        {
            TokenPrimary = 1,
            TokenImpersonation = 2
        }

        enum SECURITY_IMPERSONATION_LEVEL : int
        {
            SecurityAnonymous = 0,
            SecurityIdentification = 1,
            SecurityImpersonation = 2,
            SecurityDelegation = 3,
        }

        #endregion

        #region Constants

        public const int TOKEN_DUPLICATE = 0x0002;
        public const uint MAXIMUM_ALLOWED = 0x2000000;
        public const int CREATE_NEW_CONSOLE = 0x00000010;

        public const int IDLE_PRIORITY_CLASS = 0x40;
        public const int NORMAL_PRIORITY_CLASS = 0x20;
        public const int HIGH_PRIORITY_CLASS = 0x80;
        public const int REALTIME_PRIORITY_CLASS = 0x100;
		
		public const uint OPEN_PROCESS_TOKEN_FAILED      = 101;
		public const uint DUPLICATE_TOKEN_FAILED         = 102;
		public const uint CREATE_PROCESS_AS_USER_FAILED  = 103;
		public const uint CREATE_PROCESS_AS_USER_SUCCEED = 0;
		
        #endregion

        #region Win32 API Imports

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool CloseHandle(IntPtr hSnapshot);

        [DllImport("kernel32.dll")]
        static extern uint WTSGetActiveConsoleSessionId();

        [DllImport("advapi32.dll", EntryPoint = "CreateProcessAsUser", SetLastError = true, CharSet = CharSet.Ansi, CallingConvention = CallingConvention.StdCall)]
        public extern static bool CreateProcessAsUser(IntPtr hToken, String lpApplicationName, String lpCommandLine, ref SECURITY_ATTRIBUTES lpProcessAttributes,
            ref SECURITY_ATTRIBUTES lpThreadAttributes, bool bInheritHandle, int dwCreationFlags, IntPtr lpEnvironment,
            String lpCurrentDirectory, ref STARTUPINFO lpStartupInfo, out PROCESS_INFORMATION lpProcessInformation);

		[DllImport("kernel32.dll", EntryPoint = "GetLastError", SetLastError = true)]
        public static extern uint GetLastError();
			
        [DllImport("kernel32.dll")]
        static extern bool ProcessIdToSessionId(uint dwProcessId, ref uint pSessionId);

        [DllImport("advapi32.dll", EntryPoint = "DuplicateTokenEx")]
        public extern static bool DuplicateTokenEx(IntPtr ExistingTokenHandle, uint dwDesiredAccess,
            ref SECURITY_ATTRIBUTES lpThreadAttributes, int TokenType,
            int ImpersonationLevel, ref IntPtr DuplicateTokenHandle);

        [DllImport("kernel32.dll")]
        static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, uint dwProcessId);

        [DllImport("advapi32", SetLastError = true), SuppressUnmanagedCodeSecurity]
        static extern bool OpenProcessToken(IntPtr ProcessHandle, int DesiredAccess, ref IntPtr TokenHandle);

        #endregion

        /// 

        /// Launches the given application with full admin rights, and in addition bypasses the Vista UAC prompt
        /// 

        /// The name of the application to launch
        /// Process information regarding the launched application that gets returned to the caller
        /// 
        public static uint Start(String applicationName, string startingDir, out PROCESS_INFORMATION procInfo, out uint advErrorCode)
        {
            uint winlogonPid = 0;
            advErrorCode = 0;
            IntPtr hUserTokenDup = IntPtr.Zero, hPToken = IntPtr.Zero, hProcess = IntPtr.Zero;
            procInfo = new PROCESS_INFORMATION();

            // obtain the currently active session id; every logged on user in the system has a unique session id
            uint dwSessionId = WTSGetActiveConsoleSessionId();

            // obtain the process id of the winlogon process that is running within the currently active session
            // -- chaged by ty 
            // Process[] processes = Process.GetProcessesByName("winlogon");
            Process[] processes = Process.GetProcessesByName("explorer");
            foreach (Process p in processes)
            {
                if ((uint)p.SessionId == dwSessionId)
                {
                    winlogonPid = (uint)p.Id;
                }
            }

            // obtain a handle to the winlogon process
            hProcess = OpenProcess(MAXIMUM_ALLOWED, false, winlogonPid);

            // obtain a handle to the access token of the winlogon process
            if (!OpenProcessToken(hProcess, TOKEN_DUPLICATE, ref hPToken))
            {
                CloseHandle(hProcess);
                return OPEN_PROCESS_TOKEN_FAILED;
            }

            // Security attibute structure used in DuplicateTokenEx and CreateProcessAsUser
            // I would prefer to not have to use a security attribute variable and to just 
            // simply pass null and inherit (by default) the security attributes
            // of the existing token. However, in C# structures are value types and therefore
            // cannot be assigned the null value.
            SECURITY_ATTRIBUTES sa = new SECURITY_ATTRIBUTES();
            sa.Length = Marshal.SizeOf(sa);

            // copy the access token of the winlogon process; the newly created token will be a primary token
            if (!DuplicateTokenEx(hPToken, MAXIMUM_ALLOWED, ref sa, (int)SECURITY_IMPERSONATION_LEVEL.SecurityIdentification, (int)TOKEN_TYPE.TokenPrimary, ref hUserTokenDup))
            {
                CloseHandle(hProcess);
                CloseHandle(hPToken);
                advErrorCode = GetLastError();
                return DUPLICATE_TOKEN_FAILED;
             //   return GetLastError();
            }

            // By default CreateProcessAsUser creates a process on a non-interactive window station, meaning
            // the window station has a desktop that is invisible and the process is incapable of receiving
            // user input. To remedy this we set the lpDesktop parameter to indicate we want to enable user 
            // interaction with the new process.
            STARTUPINFO si = new STARTUPINFO();
            si.cb = (int)Marshal.SizeOf(si);
            si.lpDesktop = @"winsta0\default"; // interactive window station parameter; basically this indicates that the process created can display a GUI on the desktop

            // flags that specify the priority and creation method of the process
            int dwCreationFlags = NORMAL_PRIORITY_CLASS | CREATE_NEW_CONSOLE;

            // create a new process in the current user's logon session
            bool result = CreateProcessAsUser(hUserTokenDup,        // client's access token
                                            null,                   // file to execute
                                            applicationName,        // command line
                                            ref sa,                 // pointer to process SECURITY_ATTRIBUTES
                                            ref sa,                 // pointer to thread SECURITY_ATTRIBUTES
                                            false,                  // handles are not inheritable
                                            dwCreationFlags,        // creation flags
                                            IntPtr.Zero,            // pointer to new environment block 
                                            startingDir,                   // name of current directory 
                                            ref si,                 // pointer to STARTUPINFO structure
                                            out procInfo            // receives information about new process
                                            );

            // invalidate the handles
            CloseHandle(hProcess);
            CloseHandle(hPToken);
            CloseHandle(hUserTokenDup);
			if (!result) {
				advErrorCode = GetLastError();
                return CREATE_PROCESS_AS_USER_FAILED;
               // return GetLastError();
			} else {
				return CREATE_PROCESS_AS_USER_SUCCEED;
			}
		}
    }
}
'@


# CODE END from https://www.chasewright.com/session0bypass/ 

# CODE START from https://github.com/PowerShellMafia/PowerSploit/
function local:Get-ProcAddress {
	Param (
		[OutputType([IntPtr])]

		[Parameter( Position = 0, Mandatory = $True )]
		[String]
		$Module,
	
		[Parameter( Position = 1, Mandatory = $True )]
		[String]
		$Procedure
	)

	# Get a reference to System.dll in the GAC
	$SystemAssembly = [AppDomain]::CurrentDomain.GetAssemblies() | Where-Object { $_.GlobalAssemblyCache -And $_.Location.Split('\\')[-1].Equals('System.dll') }
	$UnsafeNativeMethods = $SystemAssembly.GetType('Microsoft.Win32.UnsafeNativeMethods')
	# Get a reference to the GetModuleHandle and GetProcAddress methods
	$GetModuleHandle = $UnsafeNativeMethods.GetMethod('GetModuleHandle')
	#$GetProcAddress = $UnsafeNativeMethods.GetMethod('GetProcAddress')
	$GetProcAddress = $UnsafeNativeMethods.GetMethod('GetProcAddress', [reflection.bindingflags] "Public,Static", $null, [System.Reflection.CallingConventions]::Any, @((New-Object System.Runtime.InteropServices.HandleRef).GetType(), [string]), $null);
	# Get a handle to the module specified
	$Kern32Handle = $GetModuleHandle.Invoke($null, @($Module))
	$tmpPtr = New-Object IntPtr
	$HandleRef = New-Object System.Runtime.InteropServices.HandleRef($tmpPtr, $Kern32Handle)

	# Return the address of the function
	$GetProcAddress.Invoke($null, @([Runtime.InteropServices.HandleRef]$HandleRef, $Procedure))
}
#Get-DelegateType from PowerSploit
function Local:Get-DelegateType
{
	Param
	(
		[OutputType([Type])]
		
		[Parameter( Position = 0)]
		[Type[]]
		$Parameters = (New-Object Type[](0)),
		
		[Parameter( Position = 1 )]
		[Type]
		$ReturnType = [Void]
	)

	$Domain = [AppDomain]::CurrentDomain
	$DynAssembly = New-Object System.Reflection.AssemblyName('ReflectedDelegate')
	$AssemblyBuilder = $Domain.DefineDynamicAssembly($DynAssembly, [System.Reflection.Emit.AssemblyBuilderAccess]::Run)
	$ModuleBuilder = $AssemblyBuilder.DefineDynamicModule('InMemoryModule', $false)
	$TypeBuilder = $ModuleBuilder.DefineType('MyDelegateType', 'Class, Public, Sealed, AnsiClass, AutoClass', [System.MulticastDelegate])
	$ConstructorBuilder = $TypeBuilder.DefineConstructor('RTSpecialName, HideBySig, Public', [System.Reflection.CallingConventions]::Standard, $Parameters)
	$ConstructorBuilder.SetImplementationFlags('Runtime, Managed')
	$MethodBuilder = $TypeBuilder.DefineMethod('Invoke', 'Public, HideBySig, NewSlot, Virtual', $ReturnType, $Parameters)
	$MethodBuilder.SetImplementationFlags('Runtime, Managed')
	
	Write-Output $TypeBuilder.CreateType()
}

$WaitForSingleObjectAddr = Get-ProcAddress kernel32.dll WaitForSingleObject
$WaitForSingleObjectDelegate = Get-DelegateType @([IntPtr], [UInt32]) ([UInt32])
$WaitForSingleObject = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer($WaitForSingleObjectAddr, $WaitForSingleObjectDelegate)
#$Win32Functions | Add-Member -MemberType NoteProperty -Name WaitForSingleObject -Value $WaitForSingleObject
# CODE END from https://github.com/PowerShellMafia/PowerSploit/

Add-Type -TypeDefinition $Source -Language CSharp

function Start-ProcessAsCurrentUser {
	param(
		[string] $commandline = "cmd.exe" ,
		[string] $workingDir = "c:\\windows\\system32",
		[switch] $wait
	)

	$waitIntervalHex = "0x00001388" # "0xFFFFFFFF" = infinite, "0x000003E8" (1s), "0x00001388" (5s), "0x00002710" (10s)
	$waitInterval = 5  # sec
	$waitCount  = 10 * 60 / 5 # 10 min
	
	$procInfo = New-Object Session0.AppLaunch+PROCESS_INFORMATION
    $advErrorCode = 0
	$returnCode = [Session0.AppLaunch]::Start($commandline,$workingDir,[ref]$procInfo,[ref]$advErrorCode)
	if ($returnCode -ne 0) { throw "Error while trying to create process : $returnCode ($advErrorCode)" }
	if ($wait){
		$waitCnt = 0
		Log-Message -v 3 "Waiting for process termination $($procInfo.hProcess) ($waitCnt)"
		$WaitForSingleObject.Invoke($procInfo.hProcess, "0xFFFFFFFF")
		# TO IMPLEMENT : save return value of WaitForSingleObject https://docs.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitforsingleobject
		#                check if return is WAIT_TIMEOUT or other return values and do necessary stuff
		
	}
	return
}

#endregion

# For compatibility with Powershell v2
if ($PSVersionTable.PSVersion -eq "2.0") {

    Function Start-ProcessAndLog{
        param(
            [ValidateNotNullOrEmpty()][string] $logName,
            [ValidateNotNullOrEmpty()][string] $FilePath,
            [switch] $runAsCurrentUser,
            $ArgumentList
        )
        Log-Message -v 4 " "
        Log-Message -v 4 " "
        Log-Message -v 4 "Starting $FilePath $ArgumentList"
        $outputFile    = "$DODO_LOG_DIR\$timestamp-$logName-both.log"
        $arguments = " /c " + '"' + "$FilePath $ArgumentList 2>&1 > $outputFile" + '"'
        if ($runAsCurrentUser) {
       	    # working example mshta.exe vbscript:Execute("cmd = ""cmd.exe"" : Set shell = CreateObject(""WScript.Shell"") : shell.Run cmd, 0, true : Set shell=Nothing:window.close")
            ## the below line would have been perfect but it seems there is a string length limitation that is reached
            # $commandline = 'mshta.exe vbscript:Execute("cmd = ""cmd.exe /c """"sleep 5 && ' + "$cmd $ArgumentList 2>&1 > $outputFile" + '"""""" : Set shell = CreateObject(""WScript.Shell"") : shell.Run cmd, 0, true : Set shell=Nothing:window.close")'
            $commandline = "$RUN_HIDDEN_NORMAL cmd.exe" + $arguments
            Log-Message -v 5 "Usermode : running (PoSh v2) Start-ProcessAsCurrentUser -wait  -commandline $commandline ... [$($commandline.Length)]"
            try {
                Start-ProcessAsCurrentUser -wait  -commandline $commandline
            } 
            catch {
                Log-Message -v 1 "ERROR raised when trying to execute command"
                Log-Message -v 1 $_.Exception.Message
            }
            Log-Message -v 3 " "
            Log-Message -v 3 "## OUTPUT and ERROR START : $outputFile"
            if (Test-Path $outputFile) {
                # $content = $(Get-Content -encoding OEM $outputFile)
                $enc = [System.Text.Encoding]::GetEncoding($Host.CurrentCulture.TextInfo.OEMCodePage)
                $bytes = [System.IO.File]::ReadAllBytes($outputFile)
                $content = $enc.GetString($bytes)
            } else {
                Log-Message -v 3 "File doesn't exist : $outputFile (no log generated... probably an error)"
            }
            if (-not $content) { 
                $content = "$($spacer)No output" 
                Log-Message -v 3 $content
            } else {
                $content | % { Log-Message -v 3 "$($spacer)$_" }
            }
            Log-Message -v 3 "## OUTPUT and ERROR END"
        
        } else {
            Log-Message -v 5 "Computermode : running (PoSh v2) Start-Process -FilePath cmd.exe -ArgumentList $arguments -wait ... [$($arguments.Length)]"
            try {
                Start-Process -FilePath "cmd.exe" -ArgumentList $arguments -wait
            } 
            catch {
                Log-Message -v 1 "ERROR raised when trying to execute command"
				Log-Message -v 1 $_.Exception.Message
            }
            Log-Message -v 3 " "
            Log-Message -v 3 "## OUTPUT and ERROR START : $outputFile"
            if (Test-Path $outputFile) {
                # $content = $(Get-Content -encoding OEM $outputFile)
                $enc = [System.Text.Encoding]::GetEncoding($Host.CurrentCulture.TextInfo.OEMCodePage)
                $bytes = [System.IO.File]::ReadAllBytes($outputFile)
                $content = $enc.GetString($bytes)
            } else {
                Log-Message -v 3 "File doesn't exist : $outputFile (no log generated... probably an error)"
            }

            if (-not $content) { 
                $content = "$($spacer)No output" 
                Log-Message -v 3 $content
            } else {
                $content | % { Log-Message -v 3 "$($spacer)$_" }
            }
            Log-Message -v 3 "## OUTPUT and ERROR END"
            Log-Message -v 3 " "
        }
        if (Test-Path $outputFile) {
            Remove-Item -Path $outputFile -Force
        }   
    }
}
if ($Help) { return Show-Help }
else { Main }