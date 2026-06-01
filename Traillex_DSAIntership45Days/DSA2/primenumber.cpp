#include<iostream>
using namespace std;

int main(){
    int num,count=1;
    cout<<"enter the number";
    cin>>num;

    for(int i=2; i<=num; i++)
    {
        if(num% i==0)
        {
            count++;
        }
    }
        if(count==2)
        {
            cout<<"it is an prime number";
        }
        else
        {
            cout<<"it is not a prime number";
        }
}