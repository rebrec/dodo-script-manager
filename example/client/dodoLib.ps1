$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition

$global:DODO_HOSTNAME = "localhost"
$global:DODO_PORT = 8088
Import-Module "$scriptPath\dodoConfig.ps1"

$global:DODO_BASE_URL          = "http://$DODO_HOSTNAME" + ":" + "$DODO_PORT/api/script"
$global:DODO_SCRIPT_NAME       = "Scriptname-not-defined"
$global:DODO_SCRIPT_VERSION    = "Scriptversion-not-defined"

[System.Collections.ArrayList]$global:DODO_LOGS = @()

#override this function if you need a different way to identify unique execution (per user, per computer, etc)
Function global:Get-UniqueExecutionId {  
    return "$env:COMPUTERNAME"
}
#lastBootTime       = Get-LastBootTime
Function global:Get-AdditionnalData{
    return @{
            username           = "$(Get-Username)"
            lastBootTime       = "$(Get-LastBootTime)"
            ipaddresses        = "$(Get-IpAddresses)"
            computername       = $env:COMPUTERNAME
            os                 = $env:OS
            powershell_version = "$($host.version)"
            logs               = $DODO_LOGS
    }
}

Function Get-Username {
    Try { # mainly used to get real user logged on when running the script as SYSTEM
        $user = (Get-Process -ProcessName explorer -IncludeUserName | select -first 1).Username
        return $user
    }
    Catch {
        return $env:USERNAME
    }
}

Function Get-IpAddresses{
    Try {
        $addresses = Get-WmiObject -Class Win32_NetworkAdapterConfiguration -Filter 'IPEnabled = True' | Select -ExpandProperty IPAddress | ?{$_ -match "192\.168"} | sort | select -first 1
        return $addresses
    }
    Catch {
        return @()
    }
}

Function Get-LastBootTime {
    $os = Get-WmiObject win32_operatingsystem -Property LastBootUpTime -ErrorAction SilentlyContinue
    if ($os.LastBootUpTime) {
       $uptime = (Get-Date) - $os.ConvertToDateTime($os.LastBootUpTime)
       #return $os.ConvertToDateTime($os.LastBootUpTime)
       = "{0:00}" -f 15
       return "{0:00}D{1:00}H{2:00}M" -f $uptime.Days, $uptime.Hours, $uptime.Minutes
    } else { return "N/A" }

}

Function logDodo{
    param($message)
    if ($message -is [array]) { $message | %{ logDodo($_) }} # we can receive command output stored into a variable as an array of lines.
    else { 
        $global:DODO_LOGS.Add($message) | out-null 
        Write-Host "$message"
    }
}

Function Get-JSONAdditionalData {
    $additionnalData = Get-AdditionnalData
    Write-Host "JSON : "Get-AdditionnalData
    return ConvertTo-Json $additionnalData
}

Function isAlreadyExecuted {
    param()
    Try {
        $url = "$DODO_BASE_URL/$DODO_SCRIPT_NAME/$DODO_SCRIPT_VERSION/$(Get-UniqueExecutionId)"
        Write-Host "Seding GET Request $url"
        $request = [System.Net.HttpWebRequest]::Create($url)
        $request.Method = "GET"
        #$request.ContentType = "application/json"

        $state = Invoke-RestMethod -Method Get -Uri $url
        if ($state.status -ne 'success'){ 
            Write-Host "Error calling isAlreadyExecuted, returned non successfull value"
            # Check wether the Log function is defined :
            if ($(Get-ChildItem function: | where {$_.name -eq 'Log' }) -ne $null) {
                Log "Something went wrong while running isAlreadyExecuted function. Result is $(ConvertTo-JSON $state)"
            }
            return $false # default is to run if no answer from the server
        }
        $res = $($state.data)
        Write-Host "isAlreadyExecuted : $res"
    
        return $res
    }
    Catch {
        return $true
    }
}
Function Update-EnvironmentData {
    Save-ExecutionStatus $false # for now do nothing more than this, will allow to decouple later on
}

Function Save-ExecutionStatus {
    param($executed=$true)
	$additionalData = Get-AdditionnalData
	$additionalData.executed = $executed
    $additionnalJSONData = ConvertTo-Json $additionalData

    $state = Invoke-RestMethod -Method Put -Uri "$DODO_BASE_URL/$DODO_SCRIPT_NAME/$DODO_SCRIPT_VERSION/$(Get-UniqueExecutionId)" -ContentType 'application/json' -Body $additionnalJSONData
    if ($state.status -ne 'success'){ 
        Write-Host "Error calling isAlreadyExecuted, returned non successfull value"
        # Check wether the Log function is defined :
        if ($(Get-ChildItem function: | where {$_.name -eq 'Log' }) -ne $null) {
            Log "Something went wrong while running Save-ExecutionStatus function. Result is $(ConvertTo-JSON $state)"
        }
        return $false # default is to run if no answer from the server
    }
    Write-Host "Save-ExecutionStatus : done"
    return $state.data
}

# For compatibility with Powershell v2
if ($PSVersionTable.PSVersion -eq "2.0") {
	Function ConvertTo-JSON([object] $item){
		add-type -assembly system.web.extensions
		$ps_js=new-object system.web.script.serialization.javascriptSerializer
		return $ps_js.Serialize($item)
	}
    function ConvertFrom-Json([object] $item){ 
        add-type -assembly system.web.extensions
        $ps_js=new-object system.web.script.serialization.javascriptSerializer
    
        #The comma operator is the array construction operator in PowerShell
        return ,$ps_js.DeserializeObject($item)
    }
    function Invoke-RestMethod {
        param($Method,$Uri, $Body, $ContentType)
        $client = New-Object System.Net.WebClient
        if ($Method -ieq "Get"){
            $json = $client.DownloadString($Uri)
            $res = ConvertFrom-Json $json
            return $res
        } elseif ($Method -ieq "Put"){
            if ($PSBoundParameters.ContainsKey('ContentType')) {
                $client.Headers["Content-Type"] = $ContentType
            }
            $json = $client.UploadString($Uri, $Method, $Body)
            $res = ConvertFrom-Json $json
            return $res
        } else {
            throw "Unknown Method : $Method (only GET and PUT are currently implemented)"
        }
       
    }    

    Function Get-Username {
        Try { # mainly used to get real user logged on when running the script as SYSTEM
            $user = (Get-WmiObject Win32_Process | ? {$_.ProcessName -like 'explorer.exe' } | select -first 1).getOwner().User
            return $user
        }
        Catch {
            return $env:USERNAME
        }
    }

}

