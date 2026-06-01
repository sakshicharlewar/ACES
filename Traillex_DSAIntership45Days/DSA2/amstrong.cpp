#include<iostream>
using namespace std;

int main()
{
     int num, rev,sum=0;
    cout << "enter a number";
    cin >> num;
    int original = num;
    while (num > 0)
    {
        rev =  num % 10;
        sum+= rev*rev*rev;
        num /= 10;
    }
    if(sum==original)
    {
        cout<<"it is amstrong number";
    }
    else
    {
        cout<<"it  not amstrong number";
    }

}