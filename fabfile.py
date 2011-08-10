from fabric.api import local
from fabric.contrib.project import rsync_project

def clean():
	local("rm -rf deploy")

def init():
	local('bin/hyde create')

def gen():
	clean()
	local('bin/hyde gen') 

def serve():
	gen()
	local('bin/hyde serve')

def push():
	gen()
	rsync_project(
			host_string="mgrosner@web196.webfaction.com", 
			remote_dir="/home/mgrosner/webapps/blog", 
			local_dir="deploy/"
	)
	#run("rsync -rav deploy mgrosner@web196.webfaction.com:/home/mgrosner/webapps/blog")
